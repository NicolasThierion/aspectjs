#!/bin/env bash

docker rm -fq gitlab-runner > /dev/null 2>&1

docker run -d --name gitlab-runner --restart always \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v gitlab-runner-config:/etc/gitlab-runner \
    gitlab/gitlab-runner:latest

docker run --rm \
  -v gitlab-runner-config:/etc/gitlab-runner \
  gitlab/gitlab-runner register \
  --non-interactive \
  --url "https://gitlab.com/" \
  --registration-token "GR1348941Ud7bmQ8oX2ssEWobxS8p" \
  --executor "docker" \
  --docker-image alpine:latest \
  --description "docker-runner" \
  --run-untagged="true" \
  --locked="true" \
  --access-level="not_protected" \
  --docker-cache-dir "/tmp/gitlab-cache" \

