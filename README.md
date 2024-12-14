# express-rdb-ejs-uploader



```
git clone https://github.com/kurosawa-kuro/express-rdb-ejs-uploader.git
cd express-rdb-ejs-uploader

sudo chmod +x ./env/setup-swap.sh
sudo ./env/setup-swap.sh


# NodeSourceリポジトリのセットアップ
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -

# Node.jsのインストール
sudo dnf install -y nodejs

# バージョン確認
node --version  # v20.x.x
npm --version   # 10.x.x


# 1. npmのキャッシュをクリア
npm cache clean --force

# 2. package-lock.jsonを削除して再試行
rm package-lock.json
npm install

# 3. より少ないメモリで実行
NODE_OPTIONS="--max-old-space-size=512" npm install

# 4. 一度に1つずつインストール
npm install --verbose --progress

chmod u+x ./env/init.sh 
./env/init.sh 
```

```
 npm run test
```

```
 npm run dev
```



![2024-12-13_13h14_01](https://github.com/user-attachments/assets/33d5bc31-a2aa-4a08-a864-f0ec8d3dd108)


```
# 1. npmのキャッシュをクリア
npm cache clean --force

# 2. package-lock.jsonを削除して再試行
rm package-lock.json
npm install

# 3. より少ないメモリで実行
NODE_OPTIONS="--max-old-space-size=512" npm install

# 4. 一度に1つずつインストール
npm install --verbose --progress
```
