# Madhuram-CRM

Solution 1: Grant Write/Modify Permissions to the Uploads Folder (Recommended)
1 Open the Windows Start menu, search for Command Prompt, right-click it, and select Run as Administrator.
2 Copy and run the following command to grant modify permissions to the uploads folder and all its subfolders:
icacls "C:\inetpub\wwwroot\Madhuram\server\uploads" /grant Everyone:(OI)(CI)M /T
3 Once completed, try uploading the candidate again. It will work immediately.

Solution 2: Run the Node.js Backend as Administrator
If you don't want to change the folder permissions, you can run the backend process with elevated privileges:

Stop your currently running backend server (press Ctrl + C in its terminal).
Open a new Command Prompt as Administrator.
Navigate to the server folder:
cmd
cd C:\inetpub\wwwroot\Madhuram\server
Start the server again:
npm run dev