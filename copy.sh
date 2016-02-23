!#/bin/bash

# Clean in and outbox
rm -f inbox/*
rm -f outbox/*

# Run this script to generate 1000 files 5k in size
# Do this after running: node index.js
for i in {1..1000}
do
   dd bs=1024 count=8 </dev/urandom > inbox/bogus$i.png
done