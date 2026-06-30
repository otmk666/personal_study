import cv2
import numpy as np
from app.core.config import settings


class FocusDetector:
    def __init__(self):
        self.enabled = settings.AI_ENABLED
        self.model_detection = None  # 物品检测模型
        self.model_pose = None       # 姿态估计模型
        self.face_mesh = None        # 人脸关键点检测器
        self._init_models()
        
        # 专注度评分
        self.current_score = 100.0
        self.min_score = 0.0
        self.initial_score = 100.0
        
        # 行为追踪
        self.behavior_states = {}  # 记录每个行为的开始时间
        self.last_behavior = "focused"
        
        # 检测周期配置（毫秒）
        self.deduction_interval = 5000  # 5秒扣1分
        self.eye_closed_start = None    # 眼睛闭上的开始时间
        
        # EAR 眼睛纵横比阈值
        self.EYE_AR_THRESH = 0.2
        self.EYE_AR_CONSEC_FRAMES = 3  # 连续多少帧眼睛闭合才算闭眼

    def _init_models(self):
        """初始化所有模型"""
        if not self.enabled:
            return
            
        # 1. 物品检测模型
        try:
            from ultralytics import YOLO
            model_path = settings.YOLO_MODEL_PATH or "yolov8n.pt"
            print(f"Loading YOLO detection model from: {model_path}")
            self.model_detection = YOLO(model_path)
            print("YOLO detection model loaded successfully")
        except Exception as e:
            print(f"Failed to load YOLO detection model: {e}")
        
        # 2. 姿态估计模型
        try:
            from ultralytics import YOLO
            # 使用 YOLOv8-pose 模型
            self.model_pose = YOLO("yolov8n-pose.pt")
            print("YOLOv8-pose model loaded successfully")
        except Exception as e:
            print(f"Failed to load YOLOv8-pose model: {e}")
        
        # 3. 人脸检测（使用 dlib 作为后备）
        try:
            import dlib
            self.face_detector = dlib.get_frontal_face_detector()
            print("Dlib face detector loaded successfully")
            
            # 尝试加载眼睛检测器
            try:
                self.shape_predictor = dlib.shape_predictor(
                    "shape_predictor_68_face_landmarks.dat"
                )
                self.has_shape_predictor = True
                print("Dlib shape predictor loaded successfully")
            except:
                print("Dlib shape predictor not found, using simplified eye detection")
                self.has_shape_predictor = False
        except ImportError:
            print("Dlib not available, eye closure detection disabled")
        except Exception as e:
            print(f"Failed to load Dlib: {e}")
            self.face_detector = None
        
        # 4. 尝试 MediaPipe 作为备选
        try:
            import mediapipe as mp
            # 检查是否正确安装
            if hasattr(mp, 'solutions'):
                self.mp_face_mesh = mp.solutions.face_mesh.FaceMesh(
                    max_num_faces=1,
                    refine_landmarks=True,
                    min_detection_confidence=0.5,
                    min_tracking_confidence=0.5
                )
                self.use_mediapipe = True
                print("MediaPipe Face Mesh loaded successfully")
            else:
                print("MediaPipe not properly installed")
                self.use_mediapipe = False
                self.mp_face_mesh = None
        except Exception as e:
            print(f"MediaPipe not available: {e}")
            self.use_mediapipe = False
            self.mp_face_mesh = None
        
        # 5. OpenCV 级联分类器作为眼睛检测的备选方案
        try:
            # 加载人脸和眼睛检测器
            cascade_path = cv2.data.haarcascades
            self.face_cascade = cv2.CascadeClassifier(
                cascade_path + 'haarcascade_frontalface_default.xml'
            )
            self.eye_cascade = cv2.CascadeClassifier(
                cascade_path + 'haarcascade_eye_tree_eyeglasses.xml'
            )
            if not self.face_cascade.empty() and not self.eye_cascade.empty():
                self.use_cv_cascade = True
                print("OpenCV cascade classifiers loaded successfully")
            else:
                self.use_cv_cascade = False
                print("Failed to load OpenCV cascade classifiers")
        except Exception as e:
            print(f"OpenCV cascade not available: {e}")
            self.use_cv_cascade = False

    def detect_frame(self, frame_data) -> dict:
        """检测单帧画面"""
        if not self.enabled:
            return self._default_result()
        
        try:
            if frame_data is None:
                return self._default_result()
            
            # 解码图片
            nparr = np.frombuffer(frame_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is None:
                return self._default_result()
            
            # 存储所有检测结果
            all_detections = []
            pose_keypoints = []
            face_landmarks = []
            person_count = 0
            
            # 1. 物品检测
            object_results = self._detect_objects(frame)
            all_detections.extend(object_results['detections'])
            person_count = object_results['person_count']
            
            # 2. 姿态估计
            pose_results = self._detect_pose(frame)
            pose_keypoints = pose_results['keypoints']
            
            # 3. 人脸关键点（眼睛检测）
            face_results = self._detect_face(frame)
            face_landmarks = face_results['landmarks']
            eye_closed = face_results['eye_closed']
            
            # 整合所有结果
            behaviors = []
            confidences = []
            
            # 检查各项行为
            if person_count == 0:
                behaviors.append("away")
                confidences.append(0.9)
            elif object_results.get('phone_detected'):
                behaviors.append("using_phone")
                confidences.append(0.85)
            elif object_results.get('food_detected'):
                behaviors.append("eating")
                confidences.append(0.8)
            elif pose_results.get('sleeping'):
                behaviors.append("sleeping")
                confidences.append(0.85)
            elif eye_closed:
                behaviors.append("eyes_closed")
                confidences.append(0.8)
            elif pose_results.get('chin_on_hand'):
                behaviors.append("chin_on_hand")
                confidences.append(0.75)
            else:
                behaviors.append("focused")
                confidences.append(0.85)
            
            # 选择最高优先级行为
            priority_order = ["sleeping", "using_phone", "eyes_closed", "chin_on_hand", 
                           "eating", "away", "focused"]
            primary_behavior = "focused"
            primary_confidence = 0.85
            
            for behavior in priority_order:
                if behavior in behaviors:
                    idx = behaviors.index(behavior)
                    primary_behavior = behavior
                    primary_confidence = confidences[idx]
                    break
            
            # 更新专注度分数
            self._update_score(primary_behavior)
            
            return {
                "focus_score": round(self.current_score, 1),
                "behavior": primary_behavior,
                "confidence": primary_confidence,
                "detections": all_detections,
                "person_count": person_count,
                "pose_keypoints": pose_keypoints,
                "eye_closed": eye_closed,
            }
            
        except Exception as e:
            print(f"Detection error: {e}")
            import traceback
            traceback.print_exc()
            return self._default_result()

    def _detect_objects(self, frame) -> dict:
        """物品检测：手机、食物等"""
        detections = []
        person_count = 0
        phone_detected = False
        food_detected = False
        
        if self.model_detection is None:
            return {"detections": detections, "person_count": 0, 
                   "phone_detected": False, "food_detected": False}
        
        try:
            results = self.model_detection(frame, conf=0.5, verbose=False)
            
            for result in results:
                if result.boxes is None:
                    continue
                for box in result.boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    xyxy = box.xyxy[0].tolist()
                    label = result.names[cls]
                    
                    detections.append({
                        "label": label,
                        "confidence": conf,
                        "bbox": xyxy,
                    })
                    
                    # 统计人物
                    if cls == 0 and conf > 0.5:  # person
                        person_count += 1
                    
                    # 检测手机 (cell phone)
                    if label == "cell phone" and conf > 0.5:
                        phone_detected = True
                    
                    # 检测食物
                    food_labels = ["banana", "apple", "sandwich", "orange", 
                                 "broccoli", "carrot", "pizza", "cake",
                                 "hot dog", "donut", "food"]
                    if label in food_labels and conf > 0.5:
                        food_detected = True
            
            return {
                "detections": detections,
                "person_count": person_count,
                "phone_detected": phone_detected,
                "food_detected": food_detected
            }
        except Exception as e:
            print(f"Object detection error: {e}")
            return {"detections": [], "person_count": 0, 
                   "phone_detected": False, "food_detected": False}

    def _detect_pose(self, frame) -> dict:
        """姿态估计：趴桌、撑脸、视线偏离"""
        if self.model_pose is None:
            return {"keypoints": [], "sleeping": False, 
                   "chin_on_hand": False, "looking_away": False}
        
        try:
            results = self.model_pose(frame, conf=0.5, verbose=False)
            
            for result in results:
                if result.keypoints is None or len(result.keypoints) == 0:
                    continue
                    
                keypoints = result.keypoints[0].xy[0].cpu().numpy()  # 17个关键点
                
                # COCO 关键点顺序:
                # 0: nose, 1: left_eye, 2: right_eye, 3: left_ear, 4: right_ear
                # 5: left_shoulder, 6: right_shoulder, 7: left_elbow, 8: right_elbow
                # 9: left_wrist, 10: right_wrist, 11: left_hip, 12: right_hip
                # 13: left_knee, 14: right_knee, 15: left_ankle, 16: right_ankle
                
                h, w = frame.shape[:2]
                keypoints_px = keypoints * np.array([w, h])
                
                # 1. 检测趴桌/睡觉：头部(nose)低于肩膀
                nose_y = keypoints_px[0][1]
                left_shoulder_y = keypoints_px[5][1]
                right_shoulder_y = keypoints_px[6][1]
                avg_shoulder_y = (left_shoulder_y + right_shoulder_y) / 2
                
                # 如果鼻子比肩膀低20%以上，认为是趴桌
                sleeping = (nose_y > avg_shoulder_y * 1.2)
                
                # 2. 检测撑脸/撑着脑袋
                # 手腕靠近头部
                left_wrist = keypoints_px[9]
                right_wrist = keypoints_px[10]
                nose = keypoints_px[0]
                left_eye = keypoints_px[1]
                right_eye = keypoints_px[2]
                
                # 计算手腕到鼻子的距离
                dist_left_wrist_nose = np.linalg.norm(left_wrist - nose)
                dist_right_wrist_nose = np.linalg.norm(right_wrist - nose)
                
                # 计算手腕到眼睛的距离
                dist_left_wrist_eye = min(
                    np.linalg.norm(left_wrist - left_eye),
                    np.linalg.norm(left_wrist - right_eye)
                )
                dist_right_wrist_eye = min(
                    np.linalg.norm(right_wrist - left_eye),
                    np.linalg.norm(right_wrist - right_eye)
                )
                
                # 阈值：手腕在头部半径的1.5倍范围内
                head_radius = np.linalg.norm(nose - left_shoulder_y) * 0.3
                chin_on_hand = (dist_left_wrist_nose < head_radius * 1.5 or 
                             dist_right_wrist_nose < head_radius * 1.5 or
                             dist_left_wrist_eye < head_radius * 1.5 or
                             dist_right_wrist_eye < head_radius * 1.5)
                
                # 3. 检测视线偏离
                # 计算头部角度（使用眼睛和鼻子）
                left_eye_pt = keypoints[1]
                right_eye_pt = keypoints[2]
                nose_pt = keypoints[0]
                
                # 眼睛中心
                eye_center = (left_eye_pt + right_eye_pt) / 2
                
                # 向量：眼睛中心到鼻子
                dx = nose_pt[0] - eye_center[0]
                dy = nose_pt[1] - eye_center[1]
                
                # 计算头部侧转角度
                angle = np.abs(np.arctan2(dy, dx) * 180 / np.pi)
                
                # 如果头部旋转超过45度，认为视线偏离
                looking_away = angle > 45 or nose_pt[0] < 0.35 or nose_pt[0] > 0.65
                
                return {
                    "keypoints": keypoints_px.tolist(),
                    "sleeping": sleeping,
                    "chin_on_hand": chin_on_hand,
                    "looking_away": looking_away
                }
            
            return {"keypoints": [], "sleeping": False, 
                   "chin_on_hand": False, "looking_away": False}
            
        except Exception as e:
            print(f"Pose detection error: {e}")
            return {"keypoints": [], "sleeping": False, 
                   "chin_on_hand": False, "looking_away": False}

    def _detect_face(self, frame) -> dict:
        """人脸关键点检测：眼睛开合"""
        import time
        
        # 检查是否有任何可用的面部检测器
        if not hasattr(self, 'face_detector') and not hasattr(self, 'mp_face_mesh'):
            return {"landmarks": [], "eye_closed": False}
        
        try:
            # 方法1: 使用 MediaPipe
            if hasattr(self, 'use_mediapipe') and self.use_mediapipe and self.mp_face_mesh:
                return self._detect_face_mediapipe(frame)
            
            # 方法2: 使用 Dlib
            if hasattr(self, 'face_detector') and self.face_detector:
                return self._detect_face_dlib(frame)
            
            # 方法3: 使用 OpenCV 级联分类器
            if hasattr(self, 'use_cv_cascade') and self.use_cv_cascade:
                return self._detect_face_cv_cascade(frame)
            
            return {"landmarks": [], "eye_closed": False}
            
        except Exception as e:
            print(f"Face detection error: {e}")
            return {"landmarks": [], "eye_closed": False}

    def _detect_face_mediapipe(self, frame) -> dict:
        """使用 MediaPipe 检测眼睛"""
        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.mp_face_mesh.process(rgb_frame)
            
            if not results.multi_face_landmarks:
                return {"landmarks": [], "eye_closed": False}
            
            face_landmarks = results.multi_face_landmarks[0]
            
            # 左眼关键点 (MediaPipe)
            left_eye_indices = [362, 385, 387, 263, 373, 380]
            right_eye_indices = [33, 160, 158, 133, 153, 144]
            
            h, w = frame.shape[:2]
            
            def calculate_ear(eye_indices):
                points = []
                for idx in eye_indices:
                    lm = face_landmarks.landmark[idx]
                    points.append(np.array([lm.x * w, lm.y * h]))
                
                A = np.linalg.norm(points[1] - points[5])
                B = np.linalg.norm(points[2] - points[4])
                C = np.linalg.norm(points[0] - points[3])
                
                ear = (A + B) / (2.0 * C) if C > 0 else 0
                return ear
            
            left_ear = calculate_ear(left_eye_indices)
            right_ear = calculate_ear(right_eye_indices)
            avg_ear = (left_ear + right_ear) / 2
            
            current_time = time.time() * 1000
            
            if avg_ear < self.EYE_AR_THRESH:
                if self.eye_closed_start is None:
                    self.eye_closed_start = current_time
                elif current_time - self.eye_closed_start > 3000:
                    return {"landmarks": face_landmarks, "eye_closed": True}
            else:
                self.eye_closed_start = None
            
            return {"landmarks": face_landmarks, "eye_closed": False}
            
        except Exception as e:
            print(f"MediaPipe face detection error: {e}")
            return {"landmarks": [], "eye_closed": False}

    def _detect_face_dlib(self, frame) -> dict:
        """使用 Dlib 检测眼睛"""
        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_detector(gray)
            
            if len(faces) == 0:
                self.eye_closed_start = None
                return {"landmarks": [], "eye_closed": False}
            
            face = faces[0]
            
            # 如果有 shape predictor，使用它来检测眼睛
            if hasattr(self, 'has_shape_predictor') and self.has_shape_predictor:
                shape = self.shape_predictor(gray, face)
                
                # 眼睛关键点 (Dlib 68点模型)
                # 左眼: 36-41, 右眼: 42-47
                left_eye = []
                right_eye = []
                
                for i in range(36, 42):
                    pt = shape.part(i)
                    left_eye.append(np.array([pt.x, pt.y]))
                
                for i in range(42, 48):
                    pt = shape.part(i)
                    right_eye.append(np.array([pt.x, pt.y]))
                
                def calculate_ear(eye_points):
                    A = np.linalg.norm(eye_points[1] - eye_points[5])
                    B = np.linalg.norm(eye_points[2] - eye_points[4])
                    C = np.linalg.norm(eye_points[0] - eye_points[3])
                    return (A + B) / (2.0 * C) if C > 0 else 0
                
                left_ear = calculate_ear(left_eye)
                right_ear = calculate_ear(right_eye)
                avg_ear = (left_ear + right_ear) / 2
                
                current_time = time.time() * 1000
                
                if avg_ear < self.EYE_AR_THRESH:
                    if self.eye_closed_start is None:
                        self.eye_closed_start = current_time
                    elif current_time - self.eye_closed_start > 3000:
                        return {"landmarks": True, "eye_closed": True}
                else:
                    self.eye_closed_start = None
                
                return {"landmarks": True, "eye_closed": False}
            
            # 如果没有 shape predictor，使用简化方法
            # 通过人脸框的高宽比判断
            face_height = face.bottom() - face.top()
            face_width = face.right() - face.left()
            
            # 如果人脸框偏窄，可能是侧脸或低头
            if face_width > 0:
                aspect_ratio = face_height / face_width
                # 正常正脸的高宽比约为 1.2-1.5
                # 如果比值太小，可能是低头或趴桌
                if aspect_ratio < 1.0:
                    return {"landmarks": True, "eye_closed": False}
            
            self.eye_closed_start = None
            return {"landmarks": True, "eye_closed": False}
            
        except Exception as e:
            print(f"Dlib face detection error: {e}")
            return {"landmarks": [], "eye_closed": False}

    def _detect_face_cv_cascade(self, frame) -> dict:
        """使用 OpenCV 级联分类器检测眼睛
        
        由于级联分类器无法直接判断眼睛开合，我们采用以下策略：
        - 检测眼睛数量：如果连续多帧检测不到眼睛，可能是在低头或闭眼
        - 使用眼睛区域变化：如果检测到的眼睛区域突然变小，可能是闭眼
        """
        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
            )
            
            if len(faces) == 0:
                self.eye_closed_start = None
                return {"landmarks": [], "eye_closed": False}
            
            # 取最大的人脸
            face = max(faces, key=lambda f: f[2] * f[3])
            x, y, w, h = face
            
            # 在人脸区域内检测眼睛
            roi_gray = gray[y:y+h, x:x+w]
            eyes = self.eye_cascade.detectMultiScale(
                roi_gray, scaleFactor=1.1, minNeighbors=3, minSize=(10, 10)
            )
            
            current_time = time.time() * 1000
            
            # 如果检测不到眼睛，认为是闭眼或低头
            if len(eyes) == 0:
                if self.eye_closed_start is None:
                    self.eye_closed_start = current_time
                elif current_time - self.eye_closed_start > 3000:  # 3秒持续无眼睛
                    return {"landmarks": True, "eye_closed": True}
            else:
                # 如果检测到眼睛，检查眼睛区域是否异常小
                avg_eye_area = np.mean([ew * eh for (ex, ey, ew, eh) in eyes])
                face_area = w * h
                eye_ratio = avg_eye_area / face_area
                
                # 如果眼睛区域占比过小，可能是闭眼
                if eye_ratio < 0.01:  # 眼睛区域小于人脸的1%
                    if self.eye_closed_start is None:
                        self.eye_closed_start = current_time
                    elif current_time - self.eye_closed_start > 3000:
                        return {"landmarks": True, "eye_closed": True}
                else:
                    self.eye_closed_start = None
            
            return {"landmarks": True, "eye_closed": False}
            
        except Exception as e:
            print(f"OpenCV cascade face detection error: {e}")
            return {"landmarks": [], "eye_closed": False}

    def _update_score(self, behavior: str):
        """更新专注度分数 - 5秒扣1分"""
        import time
        
        current_time = time.time() * 1000  # 毫秒
        
        # 分心行为列表
        distraction_behaviors = [
            "using_phone", "eating", "sleeping", "eyes_closed",
            "chin_on_hand", "away"
        ]
        
        if behavior in distraction_behaviors:
            # 记录行为开始时间
            if behavior not in self.behavior_states:
                self.behavior_states[behavior] = current_time
            else:
                start_time = self.behavior_states[behavior]
                elapsed = current_time - start_time
                
                # 每5秒扣1分
                deduction_periods = int(elapsed / self.deduction_interval)
                if deduction_periods > 0:
                    deduction = deduction_periods * 1.0
                    self.current_score = max(self.min_score, 
                                           self.current_score - deduction)
                    # 重置计时（保留余数时间）
                    self.behavior_states[behavior] = current_time - (elapsed % self.deduction_interval)
        else:
            # 专注状态，不扣分也不加分
            # 清空所有分心行为计时
            self.behavior_states = {}

    def _default_result(self) -> dict:
        """默认检测结果"""
        return {
            "focus_score": round(self.current_score, 1),
            "behavior": "unknown",
            "confidence": 0,
            "detections": [],
            "person_count": 0,
            "pose_keypoints": [],
            "eye_closed": False,
        }

    def reset_score(self):
        """重置专注度分数"""
        self.current_score = self.initial_score
        self.behavior_states = {}
        self.eye_closed_start = None
        self.last_behavior = "focused"


# 全局检测器实例
detector = FocusDetector()
