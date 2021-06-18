git stash --all && \
deno run --unstable --allow-read --allow-write --allow-run build.js && \
git add docs/. && \
git commit --amend --no-edit && \
git push --all && \
git stash pop