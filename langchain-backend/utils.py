import requests
import os
import tempfile

def download_file(url: str) -> str:
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception("Failed to download document")

    ext = os.path.splitext(url.split("?")[0])[1]
    fd, path = tempfile.mkstemp(suffix=ext)
    with open(path, "wb") as f:
        f.write(response.content)
    return path
