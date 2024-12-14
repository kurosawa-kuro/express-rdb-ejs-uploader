# express-rdb-ejs-uploader

```
# 1. インフラ構築
git clone https://github.com/kurosawa-kuro/study.git
cd study/aws-cdk/vpc-ec2-rds/assets/ansible
ansible-playbook -vvv playbooks/main.yml

# 2. メモリ解放の為、一旦EC2を再起動
sudo reboot

# 3. アプリケーションのインストール
git clone https://github.com/kurosawa-kuro/express-rdb-ejs-uploader.git
cd express-rdb-ejs-uploader

# 4. メモリ解放の為、swapファイルを作成
sudo chmod +x ./env/setup-swap.sh
sudo ./env/setup-swap.sh

# 5. アプリケーションの初期化
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
