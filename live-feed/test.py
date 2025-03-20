import requests
from bs4 import BeautifulSoup
import json
import os

def get_baidu_hotsearch():
    url = "https://top.baidu.com/board?tab=realtime"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")
    
    hotsearch_list = []
    for item in soup.select(".category-wrap_iQLoo")[:3]:  # 只取前三条
        title = item.select_one(".c-single-text-ellipsis").text.strip()
        link = item.select_one("a")['href']
        hotsearch_list.append({"title": title, "link": link})
    
    # 获取当前 Python 文件所在的目录
    script_dir = os.path.dirname(os.path.abspath(__file__))  
    json_path = os.path.join(script_dir, "hotsearch.json")

    # 将数据写入 JSON 文件
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(hotsearch_list, f, ensure_ascii=False, indent=4)

    print(f"文件已保存到 {json_path}")

if __name__ == "__main__":
    get_baidu_hotsearch()
