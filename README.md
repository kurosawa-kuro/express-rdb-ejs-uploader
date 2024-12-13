# express-rdb-ejs-uploader



```
cd express-rdb-ejs-uploader

sudo chmod +x ./env/setup-swap.sh
./env/setup-swap.sh

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
