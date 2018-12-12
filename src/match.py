
key={}
index = 0
file_object = open('write1.log', 'rb')
try:
    while True:
        chunk = file_object.read(32)
        if not chunk:
            break
        key[str(chunk)] = 1
        index += 1

finally:
     file_object.close()

print("write1:"+str(index))
match = 0     
index = 0
file_object = open('write2.log', 'rb')
try:
    while True:
        chunk = file_object.read(32)
        if not chunk:
            break
        index += 1
        res  = key.get(str(chunk), 2)
        if res  == 1:
            match += 1
            print(chunk)
finally:
     file_object.close()
print("write2:"+str(index))
print match
