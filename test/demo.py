import requests 
import socket

s = socket.socket(socket.AF_INET,socket.SOCK_STREAM)

host =socket.gethostbyname('www.google.com') 
port = 21
res = s.connect((host,port))
if res != 0:
    print("no response")
else:
    print("connected")
# print(res)

r = requests

data = r.get("https://medium.com/@old.noisy.speaker/introduction-to-payloads-in-cybersecurity-dd014fdff760")

# print(data.status_code)

