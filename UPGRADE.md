# Upgrade Guide

Guide to update your older version (e.g., from v93 to v100).

1. Check all the [changes](./imxweb/changes/changesFrom9.3.0To10.0.0.md) we made from v93 to v100.

1. Rebasing from v93 branch to v100. There are several different mothods to do it:

   Start this rebasing process without uncommitted changes.

   - Use git rebase command e.g., `git rebase v100` (recommended). You need to resolve the conflicts by every commits. Resolve them before proceeding.
   - Use git merge command e.g., `git merge v100`. You will solve all of your merge conflicts here at once.
   - Use git cherry-pick e.g., `git cherry-pick <commitHash1> <commitHash2>`. You can cherry-pick all your modification on the top of the v100 branch with the list of your commits (List commit hash with `git log` command)

   When you resolving the merge conflicts you should keep the changes come from the newer version or combine your changes with it.

1. Check the [Angular Update Guide](https://angular.dev/update-guide?v=18.0-20.0&l=3) to update your code to the required angular version.
1. Run `npm install` and rebuild all the projects to check for any issues remaining.
