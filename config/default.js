/**
 * The configuration file.
 */

var fs = require('fs');
if (fs.existsSync('/opt/app/.env')) {
    console.log('.ENV Found file');
}
    var DBURL = fs.readFileSync('/opt/app/.env', 'utf8');
//var dotenv = require('dotenv').config({path: '/opt/app/.env'});
//var dotenv = require('dotenv');
//dotenv.load();
console.log('DB connection string DBURL  :', DBURL);
var dotenv = require('dotenv').config({path: '/opt/app/.env'});
console.log('DB connection string  DB_CONNSTRING:', process.env.DB_CONNSTRING);
var DB_CONNSTRING = process.env.DB_CONNSTRING;
module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  PORT: process.env.PORT || 3000,

  JWT_SECRET: process.env.JWT_SECRET || 'hjijfvbw859',

  //DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:12345678@tc-notification-new.ci8xwsszszsw.us-east-1.rds.amazonaws.com:5432/notification',
DATABASE_URL: process.env.DATABASE_URL || DB_CONNSTRING,
DATABASE_OPTIONS: {
    dialect: 'postgres',
    pool: {
      max: 5,
      min: 0,
      idle: 10000,
    },
  },

  // comma separated Kafka hosts
  KAFKA_URL: process.env.KAFKA_URL || 'ec2-34-205-227-216.compute-1.amazonaws.com:9096,ec2-34-233-75-247.compute-1.amazonaws.com:9096,ec2-34-198-118-170.compute-1.amazonaws.com:9096,ec2-34-231-150-104.compute-1.amazonaws.com:9096,ec2-34-233-209-20.compute-1.amazonaws.com:9096,ec2-34-233-131-252.compute-1.amazonaws.com:9096,ec2-52-205-198-73.compute-1.amazonaws.com:9096,ec2-52-4-109-80.compute-1.amazonaws.com:9096', // eslint-disable-line max-len

  // ignore prefix for topics in the Kafka, e.g.
  // 'joan-26673.notifications.connect.project.updated' is considered as 'notifications.connect.project.updated'
  KAFKA_TOPIC_IGNORE_PREFIX: process.env.KAFKA_TOPIC_IGNORE_PREFIX || 'joan-26673.',

  // when notification server is deployed to multiple instances, the instances should use same group id so that
  // Kafka event is not handled duplicately in the group, an event is handled by only one instance in the group
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'tc-notification-server',

  // Kafka connection certificate, optional;
  // if not provided, then SSL connection is not used, direct insecure connection is used;
  // if provided, it can be either path to certificate file or certificate content
  KAFKA_CLIENT_CERT: process.env.KAFKA_CLIENT_CERT ||
`-----BEGIN CERTIFICATE-----
MIIDQzCCAiugAwIBAgIBADANBgkqhkiG9w0BAQsFADAyMTAwLgYDVQQDDCdjYS1j
YmJiNGVkZi1mNDFhLTRjNzMtYTg5OC01NDYyMjhkNmQyNDIwHhcNMTcwOTI3MDUw
MTIyWhcNMjcwOTI3MDUwMTIyWjAZMRcwFQYDVQQDDA51ODFvcjFsdTl2dTB1bzCC
ASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKjkcV/BXD13Q09bRKohN/sK
iDMGFA2QZ57TGd7svX7iZQIk9HmXEPd5zCTHZ6nZBbcGDQ9P+zGlJIGZQuRVKLOn
ZPilaeUHRGrvCWGJZ6lVPNqInC1STHTfFJhcUNMG6qaD2ayBAw16f13vD1wGEWCm
/DRfvrjIp3JIetGdKctmdiGLYH7CQecRW88Czx9e3Vpl1nxGcNAPDDCj0nRwuPse
fVrg5onPX355om+Ct/teSeSONhio4dFL3fwl47CXFCReZFYOrBoLexfHXHumJ/Kp
TQW+k056hhoagykcpTf8uNjxNRalDPkw7ngt+1IzatbhOacea1/WUE1444eEak8C
AwEAAaN9MHswHQYDVR0OBBYEFJJzd6OZVLthBkhVZEW42CR8NJbtMFoGA1UdIwRT
MFGAFORcypfrQ0tfS5tyBdv89jfpZEMaoTakNDAyMTAwLgYDVQQDDCdjYS1jYmJi
NGVkZi1mNDFhLTRjNzMtYTg5OC01NDYyMjhkNmQyNDKCAQAwDQYJKoZIhvcNAQEL
BQADggEBALVAdOWXdnSqhucXHjpIf0lxlH6WhzhhlctLCreSf+/7y6pPVpWSVIEl
seVxOE5tsO2OzdtGgN2t7rr6bHuakL5rk9rH06r1jYAVQBR+T6SSLFbSVzl4Q5TO
b+T9/sHx5QtXSYgMh4FhZcBjrmDmWvpd42Y4MPfjLTqTP8RWHHib8E4/FYS9txk6
WoxrKcgnm/RmOcFWrjNjgm6JJprO1BSnbc2i/Rs5rxG2tRTTmXp6d7QCRa0bdhKz
yETgcStnaVvyh64zhls3xXBm06rvpu2wwo6QHcPeekvQwxQvb63oovD8b+pFJri+
6MBSQE4TtQenlVx7Ksy9UdNmU21xCYU=
-----END CERTIFICATE-----
`,

  // Kafka connection private key, optional;
  // if not provided, then SSL connection is not used, direct insecure connection is used;
  // if provided, it can be either path to private key file or private key content
  KAFKA_CLIENT_CERT_KEY: process.env.KAFKA_CLIENT_CERT_KEY ||
`-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAqORxX8FcPXdDT1tEqiE3+wqIMwYUDZBnntMZ3uy9fuJlAiT0
eZcQ93nMJMdnqdkFtwYND0/7MaUkgZlC5FUos6dk+KVp5QdEau8JYYlnqVU82oic
LVJMdN8UmFxQ0wbqpoPZrIEDDXp/Xe8PXAYRYKb8NF++uMinckh60Z0py2Z2IYtg
fsJB5xFbzwLPH17dWmXWfEZw0A8MMKPSdHC4+x59WuDmic9ffnmib4K3+15J5I42
GKjh0Uvd/CXjsJcUJF5kVg6sGgt7F8dce6Yn8qlNBb6TTnqGGhqDKRylN/y42PE1
FqUM+TDueC37UjNq1uE5px5rX9ZQTXjjh4RqTwIDAQABAoIBAEGCOid2DJ0awVTq
hbunntsUvrdryCNqu4ZzQzmgge/RSHSIePsgiUg0SeaKIb9Tmk/fXPlvgHNFJt/N
3pBKJ7tnVlbLckOPig4gIXdfoIGhujTZgBpkLZu3W3mtdPwlVqa3xZqPf+uedACv
VTnQcLUYkAKQkJ2D1s8RJfJgD3IA7nbZkzjVdUFdpl5m2Rijs3oLvVYVsAJBSsJK
AjGWobf9pgvXhUnBxmtWKEYsnrAwNF8j+uXo8uTXZj6KMWSmKMI5urykKw/LiSk3
u0IsweCE2cqtTgP3Os5b+au/SVNfFlNOLlic/XX3Z28AvupfuoNWx30VpUsqFBE8
LQEG9EECgYEA3Z6QJKcdMmETN6C0+nMAqdibqMv4su3dmfW3M3Hw4IH/pdsQ7aOa
tn2w01BxYaYfaPjN4cksmJnYLyAHp3D8nxopKtYnS+ky162Wya1ETowjd5+0X0Lq
tMGATPzqcysVt+OO+stRuTkLKXy0OANH1OCEhzlPtFEbYDmKt6srRAkCgYEAwxfe
Ky5eJB63sEkUg0QbXsDr5to1RMrvxjmWVF51LXHBSJl/UFde6l8fOHVtDbG08XGR
lIsQ4f4vsbNOiR7bim0opYPxcxWCD13GBP1u0eUbBPpU4ac0JT12uMYRg9bB7RMl
3eWJU3qmddeAOq0oCsC7aimEFih6QCr4TNcxQZcCgYBddrzFqHDIyWXoZO9OXGfg
OYjUNEmLdIOrpZQAr0Ht/QVK9kt6XTAnXHTRebCHhR7kD2IMoeIb7W3d2f1AYYc4
tji8ZxqlihC2IvBf16HiGnnuvjy8nCUN3Dl2vodF0NrU9bRcEplBq0wI0B3VLZUC
szlRKhtyKW6JM1tMQHT7uQKBgEOP+Hirzh5kJOj/5gKvi2r9FLUVzGzOessDFnSR
YbMjOfSSc+y21UAFQSKkR+f+KtOSqP/wSSB6jrnThtclwJHny7PGRc+9GxWHPBRu
T/qQhRLsPokHBp/+8SZ8MYSe0vnvL6Xw3+XxC8SzpMytOri+lijlx8CEtBGUz/iM
bZpxAoGAEnJFUEGCB1ta3RQpI5L4nH2Rex0Avv8rkXGK2T/t5z2h8Ujg4WW3J7DD
Jp8xItVz3sqz5aCg+EvcewSGZ18AC+9cbxrbI2I83jQDHw+DQmVUyR6rl5+r+S6O
69wdZ08Y/jYkltb5PbhPqs0Kfr86cUqBuKEptRtto6Wto3k/Za4=
-----END RSA PRIVATE KEY-----
`,
};
