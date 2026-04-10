import os
import subprocess
print('PATH=', os.environ.get('PATH'))
for cmd in [['npm', '--version'], ['node', '--version'], ['where', 'npm']]:
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, shell=False)
        print('CMD:', cmd)
        print('returncode:', result.returncode)
        print('stdout:', result.stdout)
        print('stderr:', result.stderr)
    except Exception as exc:
        print('CMD ERROR:', cmd, exc)
