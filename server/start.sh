#!/bin/bash

basedir=$(dirname $0)
rm -f $basedir/naught.ipc

naught start \
  --ipc-file $basedir/naught.ipc \
  --worker-count 4 \
  --log parsley.naught.log \
  --stdout parsley.log \
  --stderr parsley.log \
  $basedir/naught.js
