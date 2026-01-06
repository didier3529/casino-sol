#!/bin/bash

# Test script to simulate webhook calls for testing the leaderboard

BACKEND_URL="http://localhost:3000"

echo "Testing Leaderboard Webhook..."
echo ""

# Test 1: Player wins
echo "Test 1: Player wins 1 SOL"
curl -X POST "$BACKEND_URL/api/webhooks/game-result" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "transactionSignature": "test-tx-1-'$(date +%s)'",
    "gameType": "coinflip",
    "betAmount": 0.5,
    "payoutAmount": 1.5,
    "isWin": true,
    "timestamp": '$(date +%s000)'
  }'
echo -e "\n"

# Test 2: Player loses
echo "Test 2: Player loses 0.5 SOL"
curl -X POST "$BACKEND_URL/api/webhooks/game-result" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "transactionSignature": "test-tx-2-'$(date +%s)'",
    "gameType": "dice",
    "betAmount": 0.5,
    "payoutAmount": 0,
    "isWin": false,
    "timestamp": '$(date +%s000)'
  }'
echo -e "\n"

# Test 3: Another player wins big
echo "Test 3: Another player wins 5 SOL"
curl -X POST "$BACKEND_URL/api/webhooks/game-result" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    "transactionSignature": "test-tx-3-'$(date +%s)'",
    "gameType": "slots",
    "betAmount": 1.0,
    "payoutAmount": 6.0,
    "isWin": true,
    "timestamp": '$(date +%s000)'
  }'
echo -e "\n"

# Test 4: Get leaderboard
echo "Test 4: Fetching leaderboard..."
curl -X GET "$BACKEND_URL/api/leaderboard?limit=10" | jq
echo -e "\n"

echo "Done!"







# Test script to simulate webhook calls for testing the leaderboard

BACKEND_URL="http://localhost:3000"

echo "Testing Leaderboard Webhook..."
echo ""

# Test 1: Player wins
echo "Test 1: Player wins 1 SOL"
curl -X POST "$BACKEND_URL/api/webhooks/game-result" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "transactionSignature": "test-tx-1-'$(date +%s)'",
    "gameType": "coinflip",
    "betAmount": 0.5,
    "payoutAmount": 1.5,
    "isWin": true,
    "timestamp": '$(date +%s000)'
  }'
echo -e "\n"

# Test 2: Player loses
echo "Test 2: Player loses 0.5 SOL"
curl -X POST "$BACKEND_URL/api/webhooks/game-result" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "transactionSignature": "test-tx-2-'$(date +%s)'",
    "gameType": "dice",
    "betAmount": 0.5,
    "payoutAmount": 0,
    "isWin": false,
    "timestamp": '$(date +%s000)'
  }'
echo -e "\n"

# Test 3: Another player wins big
echo "Test 3: Another player wins 5 SOL"
curl -X POST "$BACKEND_URL/api/webhooks/game-result" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    "transactionSignature": "test-tx-3-'$(date +%s)'",
    "gameType": "slots",
    "betAmount": 1.0,
    "payoutAmount": 6.0,
    "isWin": true,
    "timestamp": '$(date +%s000)'
  }'
echo -e "\n"

# Test 4: Get leaderboard
echo "Test 4: Fetching leaderboard..."
curl -X GET "$BACKEND_URL/api/leaderboard?limit=10" | jq
echo -e "\n"

echo "Done!"



















