-- MySQL dump 10.13  Distrib 8.0.25, for Linux (x86_64)
--
-- Host: localhost    Database: test
-- ------------------------------------------------------
-- Server version	8.0.25

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `files`
--

DROP TABLE IF EXISTS `files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner` int NOT NULL,
  `path` varchar(64) DEFAULT NULL,
  `token` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `files_token_uindex` (`token`),
  KEY `files_users_id_fk` (`owner`),
  CONSTRAINT `files_users_id_fk` FOREIGN KEY (`owner`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `files`
--

LOCK TABLES `files` WRITE;
/*!40000 ALTER TABLE `files` DISABLE KEYS */;
INSERT INTO `files` VALUES (2,21,'/static/files/i8fzlKZuLkbybRW4hGwUeZZyKDHA08eL.x-debian-package',NULL),(3,21,'/static/files/agbmCf3BlgumgHF8s7WkWZ8dXgAprwfU.x-debian-package',NULL),(4,21,'/static/files/b4HNGmrhNY935aKDLct3JtW21uCPVqIC.deb',NULL),(5,21,'/static/files/7LQV3fMZOhWLvyvGEA8ryqKPvLkWrsrx.deb',NULL),(6,29,'/static/files/9cyoezo91MK7gLViLetpslCP3XciWmOe.jpg',NULL),(7,29,'/static/files/mS1BnkUlFVfUbvIbzS6tI9b8UsCrs8vo.jpg',NULL),(8,29,'/static/files/y4tox7o5mRtemVnqIqmmlE18vlo7mHlo.mp4',NULL),(9,29,'/static/files/7SF6cOiRBjFMxqg84LC33YEI7VRGd2Xa.mp4',NULL),(10,29,'/static/files/CwsuRY3piukRujNaOQ1BeP7X40ZDCmuR.jpg',NULL),(11,29,'/static/files/pAArPSIqS2Rpg4d6Egjh0BmXIF6dfNPI.jpg',NULL),(12,29,'/static/files/wvkRHJCWtBz8SuHo1JLzn9thce5ybtIU.jpg',NULL),(13,29,'/static/files/2dsRM1Y9dNgtNiTZd0xxh87c8IcvADvN.jpg',NULL),(14,29,'/static/files/7ba1lOogGlv8RQKXKXDIeGFeZxh0tX5S.jpg',NULL),(15,29,'/static/files/erJHles8haZ7eZFu9QR7ik9hTkmSL66z.jpg',NULL),(16,29,'/static/files/FNa0A8z5ezMCI1TF757e8LaECtCku5gn.jpg',NULL),(17,29,'/static/files/yM7vv1VtcILznF6NVUWzDZZB15kuc3QF.jpg',NULL),(18,29,'/static/files/e8sKwCnEu9BIZTG4FTQmD3YunGk35835.jpg',NULL),(19,29,'/static/files/O8keyW7MQVy7n70rkzMEuK2nkINnNavm.jpg',NULL),(20,29,'/static/files/RkJHQ6fuU5vuYLD6M6fNLbC0ssIGJQjQ.jpg',NULL),(21,29,'/static/files/xCz51Hv5e3yO39RsXmR0wISWyWPvO9P5.jpg',NULL),(22,29,'/static/files/O3h4DC7vmCXuv2I1vV1hQvwboozvfzhB.jpg',NULL),(23,29,'/static/files/pKe8GsUiKQyBZtz1TfKZS1gpAgr3XEQf.jpg',NULL),(24,29,'/static/files/ROIbTNb529koMAP7AqH1ddtMdZMx2nuS.jpg',NULL),(25,21,'/static/files/HSanUDgQur5nsT54RL3JCIDXqv04IwkZ.jpg',NULL),(26,21,'/static/files/Zbg34IhpE8AFsCckQw3LjJsRJz2MZ8Mb.jpg',NULL),(27,21,'/static/files/fliYpcon2OZM1cN8KyuM4zE5ufJCVf2z.jpg',NULL),(28,21,'/static/files/IZ6kH3o33N2vEs3jK0IBmVZYredHQ3IA.jpg',NULL),(29,21,'/static/files/2GikTSrmV0vsJ8TWAhIemHtYaRu8iGVi.jpg',NULL),(30,21,'/static/files/To3VVYtRhxXAzCGe8ITe44uqbHGSfWa7.jpg',NULL),(31,21,'/static/files/0eI8swV4Rayutp2ialFz7OTKTHzzolQP.jpg',NULL),(32,21,'/static/files/R6C9GGPuq1GhHxG3Hv1QFrqPE747lzca.jpg',NULL);
/*!40000 ALTER TABLE `files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservations`
--

DROP TABLE IF EXISTS `reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `roomId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `reservations_rooms_id_fk` (`roomId`),
  KEY `reservations_users_id_fk` (`userId`),
  CONSTRAINT `reservations_rooms_id_fk` FOREIGN KEY (`roomId`) REFERENCES `rooms` (`id`),
  CONSTRAINT `reservations_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservations`
--

LOCK TABLES `reservations` WRITE;
/*!40000 ALTER TABLE `reservations` DISABLE KEYS */;
INSERT INTO `reservations` VALUES (1,28,22),(2,28,36),(3,31,37),(4,29,38),(5,29,39),(6,21,40),(7,21,39);
/*!40000 ALTER TABLE `reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `token` varchar(32) DEFAULT NULL,
  `password` varchar(64) NOT NULL,
  `host` int NOT NULL,
  `end_time` datetime DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `topic` varchar(64) DEFAULT NULL,
  `max_num` int DEFAULT '10',
  PRIMARY KEY (`id`),
  UNIQUE KEY `rooms_token_uindex` (`token`),
  KEY `rooms_users_id_fk` (`host`),
  CONSTRAINT `rooms_users_id_fk` FOREIGN KEY (`host`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (22,'MUBWoeLC','12345678',26,'2021-07-22 21:45:00','2021-07-22 19:45:00','章鱼哥1',50),(23,'mRnZPSXa','12345678',26,'2021-07-23 13:45:56','2021-07-22 13:45:56','派大星3',50),(24,'cwq9zgRp','12345678',26,'2021-07-23 13:45:58','2021-07-22 13:45:58','派大星3',50),(25,'GNmPbGFJ','12345678',26,'2021-07-23 13:45:59','2021-07-22 13:45:59','派大星3',50),(26,'vJMHDVOc','12345678',26,'2021-07-23 13:45:59','2021-07-22 13:45:59','派大星3',50),(27,'MulDP4En','12345678',26,'2021-07-23 13:48:18','2021-07-22 13:48:18','派大星2',50),(28,'55B2ztC9','12345678',26,'2021-07-23 13:48:26','2021-07-22 13:48:26','派大星2',50),(29,'840ytEoP','12345678',26,'2021-07-23 13:52:13','2021-07-22 13:52:13','派大星2',50),(30,'MT8S2u8q','12345678',26,'2021-07-23 13:55:46','2021-07-22 13:55:46','派大星2',50),(31,'cRM1oust','12345678',26,'2021-07-29 18:41:06','2021-07-28 18:41:06','试一下',50),(32,'YRFcT5UI','12345678',26,'2021-07-29 18:43:06','2021-07-28 18:43:06','试一下',50),(33,'RDqr1o4a','12345678',29,'2021-08-18 00:18:00','2021-08-02 22:18:00','test',50),(34,'YmlQYWrc','12345678',29,'2021-08-22 23:11:00','2021-08-03 21:11:00','testest',50),(35,'DygItXLj','12345678',31,'2021-08-04 10:51:19','2021-08-04 08:52:19','ss',10),(36,'T5PCV2NU','12345678',28,'2021-08-05 11:00:00','2021-08-04 11:00:00','TEST',25),(37,'WEB8xYvX','12345678',31,'2021-08-04 23:37:13','2021-08-04 21:38:13','aa',10),(38,'CgG6ZZVb','12345678',29,'2021-08-23 00:37:00','2021-08-11 22:38:00','test',50),(39,'89hXkdHn','12345678',29,'2021-08-26 00:39:00','2021-08-04 22:39:00','test2',50),(40,'EQTD2SWD','12345678',21,'2021-09-02 23:22:00','2021-08-05 21:23:00','test',50);
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(64) NOT NULL DEFAULT 'UND',
  `nickname` varchar(64) DEFAULT NULL,
  `token` varchar(32) DEFAULT NULL,
  `phone` varchar(18) DEFAULT NULL,
  `password` varchar(64) NOT NULL DEFAULT '123456',
  `verify` varchar(6) DEFAULT NULL,
  `portrait` varchar(64) DEFAULT '/static/portraits/default.png',
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_uindex` (`email`),
  UNIQUE KEY `users_token_uindex` (`token`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (21,'705320982@qq.com','shenwhang','W63aHjU626eSta82wZ9FsVvaayJiSGMl',NULL,'123456',NULL,'/static/portraits/default.png'),(26,'785490479@qq.com','LeC','ZOzMBhDlILcdULZBX0HwTW3EmKVj6MTR',NULL,'123456',NULL,'/static/portraits/PTQnbHG2dumOpYYQxG5SuC5FwOG2BVbf.jpeg'),(27,'cen-le@sjtu.edu.cn','le','buFtYmluSIiJAbceLk9mcetY4lTbVUoV',NULL,'123456',NULL,'/static/portraits/default.png'),(28,'jz2000@sjtu.edu.cn','霞风晚月','Ju2H4jQYKorFwKV58UX84D81Nci3usON',NULL,'123456',NULL,'/static/portraits/default.png'),(29,'13122616405@163.com','shenwhang','3gUxZwUaaDOvl5B9NlMpWEbWeBhQQahe',NULL,'123456',NULL,'/static/portraits/default.png'),(31,'847361724@qq.com','kendrick','v2dHGJkBjUi3Z4aOQSKo7yah6XSeJlFO',NULL,'12345678',NULL,'/static/portraits/default.png'),(33,'csc-0731@sjtu.edu.cn','kendrick-2','Wk59EOAotBE5i9yGEZGryyFaN6jSisHf',NULL,'12345678',NULL,'/static/portraits/default.png');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-08-08 13:49:29
