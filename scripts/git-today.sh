git diff --stat $(git rev-list --since=00am HEAD --reverse | head -n 1)..HEAD
