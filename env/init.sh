#!/bin/bash

# ファイルの存在確認
if [ ! -f ./env/.env.sample ]; then
    echo "Error: ./env/.env.sample file not found"
    exit 1
fi

# .envファイルが既に存在する場合の確認
if [ -f .env ]; then
    echo "Warning: .env file already exists"
    read -p "Do you want to overwrite it? (y/n): " answer
    if [ "$answer" != "y" ]; then
        echo "Operation cancelled"
        exit 0
    fi
fi

# .env.sampleを.envにコピー
cp ./env/.env.sample .env
echo "Successfully created .env file from .env.sample"

# .env.test.sampleを.env.testにコピー
cp ./env/.env.test.sample .env.test
echo "Successfully created .env.test file from .env.test.sample"

# 1. npmのキャッシュをクリア
npm cache clean --force

# 2. package-lock.jsonを削除して再試行
rm package-lock.json
npm install

# 3. より少ないメモリで実行
NODE_OPTIONS="--max-old-space-size=512" npm install

# 4. 一度に1つずつインストール
npm install --verbose --progress

# パッケージのインストール
# npm install

# マイグレーションの実行
npx prisma migrate dev --name init

# Prisma Clientの生成
npx prisma generate