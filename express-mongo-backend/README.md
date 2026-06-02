OPen Cmd as Admin

Database Backup
mongodump --uri="mongodb://127.0.0.1:27017/crm_db" --out="C:\mongodb_backup"

Import Database 
mongorestore --uri="mongodb://localhost:27017" --db=crm_db "C:\mongodb_backup\crm_db"

Dipen Pc Access
"C:\Program Files\MongoDB\Database Tools\100\bin\mongorestore.exe" --uri="mongodb://localhost:27017" --db=crm_db "C:\New folder\crm_db"