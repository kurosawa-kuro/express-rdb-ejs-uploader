#!/bin/bash

# ファイルの存在確認
if [ ! -f .env.sample ]; then
    echo "Error: .env.sample file not found"
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
cp .env.sample .env
echo "Successfully created .env file from .env.sample"

# パッケージのインストール
npm install

# マイグレーションの実行（-y オプションを削除）
npx prisma migrate dev --name init

# Prisma Clientの生成
npx prisma generate