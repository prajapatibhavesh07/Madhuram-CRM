import subprocess
import os

def run(cmd, name):
    print(f"Running {cmd}...")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        with open(f"{name}_out.txt", "w") as f:
            f.write(f"STDOUT:\n{result.stdout}\n")
            f.write(f"STDERR:\n{result.stderr}\n")
            f.write(f"EXIT CODE: {result.returncode}\n")
    except Exception as e:
        with open(f"{name}_err.txt", "w") as f:
            f.write(str(e))

run("code-review-graph build", "build")
run("code-review-graph status", "status")
