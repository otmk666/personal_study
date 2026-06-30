import json
import sys
import random
from datetime import datetime, timedelta

sys.path.insert(0, '.')

from app.core.database import SessionLocal
from app.models.models import (
    Question, Category, Tag, question_tags,
    WrongRecord, AnswerRecord, Favorite, FavoriteFolder,
    StudySession, FocusRecord
)

CATEGORIES = [
    {
        "name": "计算机基础",
        "tags": ["计算机基础", "硬件", "软件", "进制转换"],
        "questions": [
            {"q": "计算机中，1KB等于多少字节？", "opts": ["A 1000", "B 1024", "C 512", "D 2048"], "ans": "B", "diff": "easy", "tags": ["计算机基础"]},
            {"q": "以下哪个不是计算机的输入设备？", "opts": ["A 键盘", "B 鼠标", "C 打印机", "D 扫描仪"], "ans": "C", "diff": "easy", "tags": ["计算机基础", "硬件"]},
            {"q": "二进制数 1011 转换为十进制数是多少？", "opts": ["A 10", "B 11", "C 12", "D 13"], "ans": "B", "diff": "medium", "tags": ["进制转换"]},
            {"q": "CPU的中文全称是什么？", "opts": ["A 中央处理器", "B 内存储器", "C 外存储器", "D 输入输出设备"], "ans": "A", "diff": "easy", "tags": ["计算机基础", "硬件"]},
            {"q": "以下哪种存储器断电后数据会丢失？", "opts": ["A ROM", "B RAM", "C 硬盘", "D U盘"], "ans": "B", "diff": "easy", "tags": ["计算机基础", "硬件"]},
            {"q": "十进制数 25 转换为二进制数是多少？", "opts": ["A 10011", "B 11001", "C 10101", "D 11010"], "ans": "B", "diff": "medium", "tags": ["进制转换"]},
            {"q": "以下哪个不是操作系统？", "opts": ["A Windows", "B Linux", "C Oracle", "D macOS"], "ans": "C", "diff": "easy", "tags": ["软件", "操作系统"]},
            {"q": "计算机病毒的本质是什么？", "opts": ["A 生物病毒", "B 特殊的程序", "C 硬件故障", "D 数据错误"], "ans": "B", "diff": "easy", "tags": ["计算机基础"]},
            {"q": "1GB等于多少MB？", "opts": ["A 100", "B 512", "C 1000", "D 1024"], "ans": "D", "diff": "easy", "tags": ["计算机基础"]},
            {"q": "以下哪个是高级编程语言？", "opts": ["A 机器语言", "B 汇编语言", "C Python", "D 以上都不是"], "ans": "C", "diff": "easy", "tags": ["软件"]},
            {"q": "ASCII码中，字母A对应的十进制值是？", "opts": ["A 64", "B 65", "C 96", "D 97"], "ans": "B", "diff": "medium", "tags": ["计算机基础"]},
            {"q": "以下哪种不是常见的网络拓扑结构？", "opts": ["A 星型", "B 环型", "C 树型", "D 随机型"], "ans": "D", "diff": "easy", "tags": ["计算机基础"]},
            {"q": "冯诺依曼计算机的核心思想是什么？", "opts": ["A 存储程序", "B 并行计算", "C 分布式计算", "D 量子计算"], "ans": "A", "diff": "medium", "tags": ["计算机基础"]},
            {"q": "以下哪个是输出设备？", "opts": ["A 键盘", "B 鼠标", "C 显示器", "D 摄像头"], "ans": "C", "diff": "easy", "tags": ["计算机基础", "硬件"]},
            {"q": "八进制数 17 转换为十进制是多少？", "opts": ["A 15", "B 17", "C 19", "D 23"], "ans": "A", "diff": "medium", "tags": ["进制转换"]},
            {"q": "以下哪个不属于系统软件？", "opts": ["A 操作系统", "B 编译程序", "C 数据库管理系统", "D 文字处理软件"], "ans": "D", "diff": "medium", "tags": ["软件"]},
            {"q": "计算机网络最主要的功能是？", "opts": ["A 计算速度快", "B 资源共享", "C 存储容量大", "D 可靠性高"], "ans": "B", "diff": "easy", "tags": ["计算机基础"]},
            {"q": "十六进制数 1A 转换为十进制是多少？", "opts": ["A 16", "B 26", "C 36", "D 46"], "ans": "B", "diff": "medium", "tags": ["进制转换"]},
            {"q": "以下哪种不是计算机的特点？", "opts": ["A 运算速度快", "B 具有记忆能力", "C 具有逻辑判断能力", "D 具有思维能力"], "ans": "D", "diff": "easy", "tags": ["计算机基础"]},
            {"q": "BIOS的主要作用是？", "opts": ["A 管理文件", "B 计算机基本输入输出系统", "C 处理图像", "D 连接网络"], "ans": "B", "diff": "medium", "tags": ["计算机基础", "硬件"]},
        ]
    },
    {
        "name": "数据结构",
        "tags": ["数据结构", "数组", "链表", "栈", "队列", "树", "排序"],
        "questions": [
            {"q": "以下哪种数据结构是先进先出（FIFO）？", "opts": ["A 栈", "B 队列", "C 数组", "D 链表"], "ans": "B", "diff": "easy", "tags": ["队列"]},
            {"q": "栈的特点是什么？", "opts": ["A 先进先出", "B 后进先出", "C 随机访问", "D 顺序访问"], "ans": "B", "diff": "easy", "tags": ["栈"]},
            {"q": "在单链表中，要删除某一指定结点，必须先找到该结点的什么？", "opts": ["A 前驱结点", "B 后继结点", "C 数据域", "D 指针域"], "ans": "A", "diff": "medium", "tags": ["链表"]},
            {"q": "二叉树的前序遍历顺序是？", "opts": ["A 左-根-右", "B 根-左-右", "C 左-右-根", "D 右-根-左"], "ans": "B", "diff": "medium", "tags": ["树"]},
            {"q": "以下哪种排序算法的平均时间复杂度是O(n log n)？", "opts": ["A 冒泡排序", "B 选择排序", "C 快速排序", "D 插入排序"], "ans": "C", "diff": "medium", "tags": ["排序"]},
            {"q": "数组的特点是什么？", "opts": ["A 动态大小", "B 内存连续，随机访问", "C 插入删除高效", "D 只能存储同类型数据"], "ans": "B", "diff": "easy", "tags": ["数组"]},
            {"q": "深度为k的二叉树最多有多少个结点？", "opts": ["A 2^k - 1", "B 2^k", "C 2^(k-1)", "D k^2"], "ans": "A", "diff": "medium", "tags": ["树"]},
            {"q": "以下哪种数据结构适合实现递归？", "opts": ["A 队列", "B 栈", "C 数组", "D 链表"], "ans": "B", "diff": "easy", "tags": ["栈"]},
            {"q": "在长度为n的顺序表中插入一个元素，平均需要移动多少个元素？", "opts": ["A n/2", "B n", "C (n+1)/2", "D (n-1)/2"], "ans": "A", "diff": "medium", "tags": ["数组"]},
            {"q": "完全二叉树的定义是？", "opts": ["A 所有结点都有两个子结点", "B 除最后一层外，其他层都是满的，最后一层结点靠左排列", "C 只有左子树", "D 只有右子树"], "ans": "B", "diff": "medium", "tags": ["树"]},
            {"q": "冒泡排序的最坏时间复杂度是？", "opts": ["A O(n)", "B O(n log n)", "C O(n²)", "D O(log n)"], "ans": "C", "diff": "easy", "tags": ["排序"]},
            {"q": "循环队列空的条件是？", "opts": ["A front == rear", "B front == rear + 1", "C rear == front + 1", "D front == 0"], "ans": "A", "diff": "medium", "tags": ["队列"]},
            {"q": "以下哪种不是线性表的存储结构？", "opts": ["A 顺序存储", "B 链式存储", "C 散列存储", "D 以上都不是"], "ans": "C", "diff": "medium", "tags": ["数据结构"]},
            {"q": "二叉搜索树的中序遍历结果是？", "opts": ["A 有序序列", "B 无序序列", "C 逆序序列", "D 随机序列"], "ans": "A", "diff": "medium", "tags": ["树"]},
            {"q": "哈希表解决冲突的方法不包括？", "opts": ["A 开放定址法", "B 链地址法", "C 再哈希法", "D 递归法"], "ans": "D", "diff": "medium", "tags": ["数据结构"]},
            {"q": "顺序栈中，top指针指向栈顶元素，那么入栈操作的第一步是？", "opts": ["A top++", "B 存入元素", "C top--", "D 取出元素"], "ans": "A", "diff": "medium", "tags": ["栈"]},
            {"q": "在单链表的表头插入一个新结点，时间复杂度是？", "opts": ["A O(1)", "B O(n)", "C O(n²)", "D O(log n)"], "ans": "A", "diff": "easy", "tags": ["链表"]},
            {"q": "以下哪种是稳定的排序算法？", "opts": ["A 快速排序", "B 堆排序", "C 归并排序", "D 选择排序"], "ans": "C", "diff": "hard", "tags": ["排序"]},
            {"q": "串的模式匹配是指？", "opts": ["A 比较两个串的大小", "B 求子串在主串中的位置", "C 连接两个串", "D 替换子串"], "ans": "B", "diff": "medium", "tags": ["数据结构"]},
            {"q": "二叉树的第i层最多有多少个结点？", "opts": ["A 2^i", "B 2^(i-1)", "C i²", "D i"], "ans": "B", "diff": "medium", "tags": ["树"]},
        ]
    },
    {
        "name": "操作系统",
        "tags": ["操作系统", "进程", "线程", "内存管理", "死锁", "文件系统"],
        "questions": [
            {"q": "操作系统的主要功能不包括？", "opts": ["A 进程管理", "B 内存管理", "C 编译程序", "D 文件管理"], "ans": "C", "diff": "easy", "tags": ["操作系统"]},
            {"q": "进程和线程的区别是什么？", "opts": ["A 进程是资源分配的基本单位，线程是CPU调度的基本单位", "B 进程是CPU调度的基本单位，线程是资源分配的基本单位", "C 两者完全相同", "D 线程不能并发执行"], "ans": "A", "diff": "medium", "tags": ["进程", "线程"]},
            {"q": "死锁的四个必要条件不包括？", "opts": ["A 互斥条件", "B 请求与保持条件", "C 可抢占条件", "D 循环等待条件"], "ans": "C", "diff": "medium", "tags": ["死锁"]},
            {"q": "以下哪种不是进程调度算法？", "opts": ["A 先来先服务", "B 时间片轮转", "C 优先级调度", "D 最近最少使用"], "ans": "D", "diff": "medium", "tags": ["进程"]},
            {"q": "虚拟内存的主要作用是？", "opts": ["A 提高CPU速度", "B 扩展内存空间", "C 加快磁盘访问", "D 减少功耗"], "ans": "B", "diff": "easy", "tags": ["内存管理"]},
            {"q": "以下哪个不是进程的基本状态？", "opts": ["A 就绪态", "B 运行态", "C 阻塞态", "D 死锁态"], "ans": "D", "diff": "easy", "tags": ["进程"]},
            {"q": "页面置换算法中，LRU是指？", "opts": ["A 最近最不常用", "B 最近最少使用", "C 先进先出", "D 最佳置换"], "ans": "B", "diff": "medium", "tags": ["内存管理"]},
            {"q": "文件系统中，FAT是指？", "opts": ["A 文件分配表", "B 文件传输协议", "C 文件属性表", "D 文件访问表"], "ans": "A", "diff": "medium", "tags": ["文件系统"]},
            {"q": "银行家算法用于解决什么问题？", "opts": ["A 进程调度", "B 死锁避免", "C 内存分配", "D 文件管理"], "ans": "B", "diff": "medium", "tags": ["死锁"]},
            {"q": "以下哪种不是内存管理方式？", "opts": ["A 分区管理", "B 分页管理", "C 分段管理", "D 队列管理"], "ans": "D", "diff": "easy", "tags": ["内存管理"]},
            {"q": "线程相比进程的优势是？", "opts": ["A 更安全", "B 创建和切换开销小", "C 拥有更多资源", "D 更稳定"], "ans": "B", "diff": "easy", "tags": ["线程"]},
            {"q": "产生死锁的原因是？", "opts": ["A 资源竞争和进程推进顺序非法", "B CPU速度太慢", "C 内存不足", "D 磁盘空间不足"], "ans": "A", "diff": "medium", "tags": ["死锁"]},
            {"q": "操作系统中，缓冲区的作用是？", "opts": ["A 提高CPU速度", "B 缓和CPU与I/O设备速度不匹配的矛盾", "C 增加内存容量", "D 减少功耗"], "ans": "B", "diff": "medium", "tags": ["操作系统"]},
            {"q": "以下哪个是分时操作系统的特点？", "opts": ["A 多路性", "B 独占性", "C 及时性", "D 以上都是"], "ans": "D", "diff": "medium", "tags": ["操作系统"]},
            {"q": "进程同步的主要目的是？", "opts": ["A 提高CPU利用率", "B 协调进程对共享资源的访问", "C 增加内存容量", "D 减少进程数量"], "ans": "B", "diff": "medium", "tags": ["进程"]},
            {"q": "以下哪种不是I/O控制方式？", "opts": ["A 程序查询方式", "B 中断方式", "C DMA方式", "D 缓存方式"], "ans": "D", "diff": "medium", "tags": ["操作系统"]},
            {"q": "实时操作系统的主要特点是？", "opts": ["A 响应及时", "B 吞吐量大", "C 资源利用率高", "D 界面友好"], "ans": "A", "diff": "easy", "tags": ["操作系统"]},
            {"q": "分页和分段的主要区别是？", "opts": ["A 页是物理单位，段是逻辑单位", "B 页是逻辑单位，段是物理单位", "C 两者完全相同", "D 页的大小不固定"], "ans": "A", "diff": "hard", "tags": ["内存管理"]},
            {"q": "SPOOLing技术是指？", "opts": ["A 假脱机技术", "B 真脱机技术", "C 联机技术", "D 离线技术"], "ans": "A", "diff": "medium", "tags": ["操作系统"]},
            {"q": "文件的物理结构不包括？", "opts": ["A 顺序结构", "B 链接结构", "C 索引结构", "D 树形结构"], "ans": "D", "diff": "medium", "tags": ["文件系统"]},
        ]
    },
    {
        "name": "计算机网络",
        "tags": ["计算机网络", "TCP/IP", "HTTP", "DNS", "网络安全", "传输层"],
        "questions": [
            {"q": "OSI七层模型中，第三层是？", "opts": ["A 物理层", "B 数据链路层", "C 网络层", "D 传输层"], "ans": "C", "diff": "easy", "tags": ["计算机网络"]},
            {"q": "TCP是哪种类型的协议？", "opts": ["A 无连接的协议", "B 面向连接的协议", "C 不可靠的协议", "D 以上都不是"], "ans": "B", "diff": "easy", "tags": ["TCP/IP", "传输层"]},
            {"q": "HTTP默认使用的端口号是？", "opts": ["A 21", "B 23", "C 80", "D 443"], "ans": "C", "diff": "easy", "tags": ["HTTP"]},
            {"q": "DNS的主要作用是？", "opts": ["A 文件传输", "B 域名解析", "C 邮件发送", "D 远程登录"], "ans": "B", "diff": "easy", "tags": ["DNS"]},
            {"q": "TCP三次握手的目的是？", "opts": ["A 建立可靠连接", "B 传输数据", "C 释放连接", "D 域名解析"], "ans": "A", "diff": "medium", "tags": ["TCP/IP", "传输层"]},
            {"q": "以下哪个不是TCP/IP协议族的层次？", "opts": ["A 网络接口层", "B 网络层", "C 传输层", "D 表示层"], "ans": "D", "diff": "medium", "tags": ["TCP/IP"]},
            {"q": "HTTPS使用的默认端口是？", "opts": ["A 80", "B 8080", "C 443", "D 8443"], "ans": "C", "diff": "easy", "tags": ["HTTP", "网络安全"]},
            {"q": "IP地址192.168.1.1属于哪类地址？", "opts": ["A A类", "B B类", "C C类", "D D类"], "ans": "C", "diff": "easy", "tags": ["计算机网络"]},
            {"q": "UDP协议的特点是？", "opts": ["A 面向连接", "B 可靠传输", "C 无连接，不可靠", "D 以上都不是"], "ans": "C", "diff": "easy", "tags": ["TCP/IP", "传输层"]},
            {"q": "ARP协议的作用是？", "opts": ["A IP地址转换为MAC地址", "B MAC地址转换为IP地址", "C 域名转换为IP地址", "D IP地址转换为域名"], "ans": "A", "diff": "medium", "tags": ["计算机网络"]},
            {"q": "子网掩码的作用是？", "opts": ["A 区分网络号和主机号", "B 加密数据", "C 压缩数据", "D 提高速度"], "ans": "A", "diff": "medium", "tags": ["计算机网络"]},
            {"q": "以下哪个不是应用层协议？", "opts": ["A HTTP", "B FTP", "C TCP", "D SMTP"], "ans": "C", "diff": "easy", "tags": ["TCP/IP"]},
            {"q": "防火墙的主要作用是？", "opts": ["A 提高网速", "B 网络安全防护", "C 数据加密", "D 数据压缩"], "ans": "B", "diff": "easy", "tags": ["网络安全"]},
            {"q": "TCP四次挥手的目的是？", "opts": ["A 建立连接", "B 可靠地释放连接", "C 传输数据", "D 域名解析"], "ans": "B", "diff": "medium", "tags": ["TCP/IP", "传输层"]},
            {"q": "以下哪种不是网络攻击方式？", "opts": ["A DDoS攻击", "B SQL注入", "C XSS攻击", "D 数据备份"], "ans": "D", "diff": "easy", "tags": ["网络安全"]},
            {"q": "B类IP地址的默认子网掩码是？", "opts": ["A 255.0.0.0", "B 255.255.0.0", "C 255.255.255.0", "D 255.255.255.255"], "ans": "B", "diff": "medium", "tags": ["计算机网络"]},
            {"q": "SMTP协议用于？", "opts": ["A 接收邮件", "B 发送邮件", "C 文件传输", "D 远程登录"], "ans": "B", "diff": "easy", "tags": ["计算机网络"]},
            {"q": "以下哪个是对称加密算法？", "opts": ["A RSA", "B DES", "C ECC", "D DSA"], "ans": "B", "diff": "medium", "tags": ["网络安全"]},
            {"q": "VLAN的主要作用是？", "opts": ["A 扩大网络范围", "B 隔离广播域，提高安全性", "C 提高网速", "D 增加带宽"], "ans": "B", "diff": "medium", "tags": ["计算机网络"]},
            {"q": "HTTP状态码404表示？", "opts": ["A 服务器错误", "B 请求成功", "C 资源未找到", "D 重定向"], "ans": "C", "diff": "easy", "tags": ["HTTP"]},
        ]
    },
    {
        "name": "数据库",
        "tags": ["数据库", "SQL", "MySQL", "事务", "索引", "范式"],
        "questions": [
            {"q": "SQL语言中，查询数据使用哪个关键字？", "opts": ["A INSERT", "B UPDATE", "C SELECT", "D DELETE"], "ans": "C", "diff": "easy", "tags": ["SQL"]},
            {"q": "关系数据库中，主键的特点是？", "opts": ["A 可以为空", "B 唯一且不为空", "C 可以重复", "D 以上都不对"], "ans": "B", "diff": "easy", "tags": ["数据库"]},
            {"q": "事务的ACID特性不包括？", "opts": ["A 原子性", "B 一致性", "C 隔离性", "D 持久性"], "ans": "C", "diff": "medium", "tags": ["事务"]},
            {"q": "以下哪个不是SQL的连接类型？", "opts": ["A INNER JOIN", "B LEFT JOIN", "C RIGHT JOIN", "D UP JOIN"], "ans": "D", "diff": "easy", "tags": ["SQL"]},
            {"q": "数据库索引的主要作用是？", "opts": ["A 节省存储空间", "B 提高查询速度", "C 提高插入速度", "D 保证数据一致性"], "ans": "B", "diff": "easy", "tags": ["索引"]},
            {"q": "第一范式（1NF）要求？", "opts": ["A 属性不可再分", "B 消除部分依赖", "C 消除传递依赖", "D 消除多值依赖"], "ans": "A", "diff": "medium", "tags": ["范式"]},
            {"q": "MySQL中，查看数据库结构用哪个命令？", "opts": ["A SHOW TABLES", "B DESC", "C SELECT", "D VIEW"], "ans": "B", "diff": "easy", "tags": ["MySQL"]},
            {"q": "事务隔离级别中，哪个级别最高？", "opts": ["A 读未提交", "B 读已提交", "C 可重复读", "D 串行化"], "ans": "D", "diff": "medium", "tags": ["事务"]},
            {"q": "SQL中，GROUP BY子句的作用是？", "opts": ["A 排序结果", "B 分组统计", "C 过滤结果", "D 连接表"], "ans": "B", "diff": "easy", "tags": ["SQL"]},
            {"q": "以下哪种不是数据库恢复技术？", "opts": ["A 数据转储", "B 登记日志文件", "C 数据加密", "D 具有检查点的恢复技术"], "ans": "C", "diff": "medium", "tags": ["数据库"]},
            {"q": "SQL中，HAVING子句通常和哪个一起使用？", "opts": ["A WHERE", "B GROUP BY", "C ORDER BY", "D LIMIT"], "ans": "B", "diff": "medium", "tags": ["SQL"]},
            {"q": "外键约束的作用是？", "opts": ["A 提高查询速度", "B 保证参照完整性", "C 节省存储空间", "D 提高插入速度"], "ans": "B", "diff": "medium", "tags": ["数据库"]},
            {"q": "以下哪个不是数据库系统的组成部分？", "opts": ["A 数据库", "B 数据库管理系统", "C 应用程序", "D 打印机"], "ans": "D", "diff": "easy", "tags": ["数据库"]},
            {"q": "B+树索引相比B树索引的优势是？", "opts": ["A 树高更高", "B 叶子结点链表，范围查询更高效", "C 每个结点存储更多数据", "D 占用空间更小"], "ans": "B", "diff": "hard", "tags": ["索引"]},
            {"q": "SQL中，DISTINCT关键字的作用是？", "opts": ["A 去重", "B 排序", "C 分组", "D 过滤"], "ans": "A", "diff": "easy", "tags": ["SQL"]},
            {"q": "数据库的三级模式不包括？", "opts": ["A 模式", "B 外模式", "C 内模式", "D 中间模式"], "ans": "D", "diff": "medium", "tags": ["数据库"]},
            {"q": "MySQL中，存储引擎InnoDB的特点是？", "opts": ["A 不支持事务", "B 支持事务和行级锁", "C 不支持外键", "D 查询速度最快"], "ans": "B", "diff": "medium", "tags": ["MySQL"]},
            {"q": "以下哪个不是聚合函数？", "opts": ["A COUNT", "B SUM", "C AVG", "D JOIN"], "ans": "D", "diff": "easy", "tags": ["SQL"]},
            {"q": "数据库设计的步骤中，第一个步骤是？", "opts": ["A 需求分析", "B 概念结构设计", "C 逻辑结构设计", "D 物理结构设计"], "ans": "A", "diff": "medium", "tags": ["数据库"]},
            {"q": "脏读是指？", "opts": ["A 读取了其他事务未提交的数据", "B 同一事务内两次读取结果不同", "C 幻读", "D 以上都不是"], "ans": "A", "diff": "medium", "tags": ["事务"]},
        ]
    },
]


def create_categories_and_questions():
    db = SessionLocal()
    created_count = 0

    for cat_data in CATEGORIES:
        # 获取或创建分类
        cat = db.query(Category).filter(Category.name == cat_data["name"]).first()
        if not cat:
            cat = Category(name=cat_data["name"])
            db.add(cat)
            db.flush()

        # 获取或创建标签
        tag_map = {}
        for tag_name in cat_data["tags"]:
            tag = db.query(Tag).filter(Tag.name == tag_name).first()
            if not tag:
                tag = Tag(name=tag_name, color=f"#{random.randint(0, 0xffffff):06x}")
                db.add(tag)
                db.flush()
            tag_map[tag_name] = tag.id

        # 添加题目
        for q in cat_data["questions"]:
            # 检查题目是否已存在（用标题判断）
            existing = db.query(Question).filter(Question.title == q["q"]).first()
            if existing:
                continue

            question = Question(
                question_type="single",
                title=q["q"],
                options=q["opts"],
                answer=[q["ans"]],
                analysis=f"正确答案是{q['ans']}",
                difficulty=q["diff"],
                category_id=cat.id,
            )
            db.add(question)
            db.flush()

            # 添加标签
            for tag_name in q["tags"]:
                if tag_name in tag_map:
                    stmt = question_tags.insert().values(
                        question_id=question.id, tag_id=tag_map[tag_name]
                    )
                    db.execute(stmt)

            created_count += 1

    db.commit()
    print(f"创建了 {created_count} 道题目")
    db.close()
    return created_count


def generate_history_data():
    db = SessionLocal()

    questions = db.query(Question).all()
    if not questions:
        print("没有题目，跳过生成历史数据")
        db.close()
        return

    categories = db.query(Category).all()
    q_by_cat = {}
    for q in questions:
        if q.category_id not in q_by_cat:
            q_by_cat[q.category_id] = []
        q_by_cat[q.category_id].append(q)

    today = datetime.now()
    total_answer_records = 0
    total_wrong_records = 0
    total_favorites = 0

    # 创建收藏夹
    folder1 = db.query(FavoriteFolder).filter(FavoriteFolder.name == "重点复习").first()
    if not folder1:
        folder1 = FavoriteFolder(name="重点复习", description="需要重点掌握的题目")
        db.add(folder1)
        db.flush()

    folder2 = db.query(FavoriteFolder).filter(FavoriteFolder.name == "易错题").first()
    if not folder2:
        folder2 = FavoriteFolder(name="易错题", description="容易做错的题目")
        db.add(folder2)
        db.flush()

    # 生成近7天数据
    for day_offset in range(6, -1, -1):
        day = today - timedelta(days=day_offset)
        date_str = day.strftime("%Y-%m-%d")

        # 每天2-4个学习会话
        num_sessions = random.randint(2, 4)
        for s in range(num_sessions):
            session_id = f"hist_{date_str}_{s}"

            # 选择分类
            cat = random.choice(categories) if categories else None
            cat_questions = q_by_cat.get(cat.id, questions) if cat else questions

            # 每会话15-30题
            num_q = random.randint(15, 30)
            session_questions = random.sample(cat_questions, min(num_q, len(cat_questions)))

            start_hour = random.choice([8, 9, 10, 14, 15, 16, 19, 20])
            start_time = day.replace(hour=start_hour, minute=random.randint(0, 30), second=0)

            correct_count = 0
            total_time = 0

            for i, q in enumerate(session_questions):
                is_correct = random.random() < 0.7  # 70%正确率
                if is_correct:
                    correct_count += 1
                time_spent = random.randint(15, 60)
                total_time += time_spent

                q_time = start_time + timedelta(seconds=total_time)

                # 答题记录
                record = AnswerRecord(
                    question_id=q.id,
                    session_id=session_id,
                    is_correct=is_correct,
                    user_answer=[random.choice(["A", "B", "C", "D"])] if not is_correct else q.answer,
                    time_spent=time_spent,
                    mode=random.choice(["practice", "random", "exam"]),
                    created_at=q_time,
                )
                db.add(record)
                total_answer_records += 1

                # 错题本（答错的加入）
                if not is_correct:
                    wr = db.query(WrongRecord).filter(WrongRecord.question_id == q.id).first()
                    if not wr:
                        mastered = random.random() < 0.3  # 30%已掌握
                        wr = WrongRecord(
                            question_id=q.id,
                            wrong_count=random.randint(1, 5),
                            last_wrong_at=q_time,
                            mastered=mastered,
                            next_review_at=q_time + timedelta(days=random.randint(1, 7)) if not mastered else None,
                            review_stage=random.randint(0, 3) if not mastered else 5,
                            created_at=q_time,
                        )
                        db.add(wr)
                        total_wrong_records += 1
                    else:
                        wr.wrong_count += 1
                        wr.last_wrong_at = q_time

            # 学习会话
            end_time = start_time + timedelta(seconds=total_time)
            avg_score = random.uniform(70, 95)

            session = StudySession(
                session_id=session_id,
                mode=random.choice(["practice", "random", "exam"]),
                total_questions=len(session_questions),
                correct_count=correct_count,
                total_time=total_time,
                avg_focus_score=avg_score,
                start_time=start_time,
                end_time=end_time,
                status="completed",
            )
            db.add(session)

            # 专注度记录（每分钟一条）
            num_focus = max(1, total_time // 60)
            for f in range(num_focus):
                f_time = start_time + timedelta(minutes=f)
                behavior = "focused"
                score = avg_score + random.uniform(-10, 10)
                score = max(0, min(100, score))

                if random.random() < 0.15:
                    behavior = random.choice(["using_phone", "eating", "eyes_closed", "chin_on_hand", "away"])

                fr = FocusRecord(
                    session_id=session_id,
                    timestamp=f_time,
                    focus_score=score,
                    behavior=behavior,
                    duration=60.0,
                )
                db.add(fr)

    # 收藏夹（随机收藏一些题目）
    all_questions_ids = [q.id for q in questions]
    fav_q_ids = random.sample(all_questions_ids, min(15, len(all_questions_ids)))
    for qid in fav_q_ids:
        existing = db.query(Favorite).filter(Favorite.question_id == qid).first()
        if not existing:
            folder = random.choice([folder1, folder2, None])
            fav = Favorite(
                question_id=qid,
                folder_id=folder.id if folder else None,
                created_at=today - timedelta(days=random.randint(0, 6)),
            )
            db.add(fav)
            total_favorites += 1

    db.commit()
    print(f"生成了 {total_answer_records} 条答题记录")
    print(f"生成了 {total_wrong_records} 条错题记录")
    print(f"收藏了 {total_favorites} 道题目")

    db.close()


if __name__ == "__main__":
    print("开始生成数据...")
    create_categories_and_questions()
    print("\n开始生成历史数据...")
    generate_history_data()
    print("\n全部完成！")
