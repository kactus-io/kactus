export type MenuEvent =
  | 'push'
  | 'force-push'
  | 'pull'
  | 'show-changes'
  | 'show-history'
  | 'add-local-repository'
  | 'create-branch'
  | 'show-branches'
  | 'remove-repository'
  | 'create-repository'
  | 'rename-branch'
  | 'delete-branch'
  | 'discard-all-changes'
  | 'stash-all-changes'
  | 'show-preferences'
  | 'choose-repository'
  | 'open-working-directory'
  | 'update-branch'
  | 'compare-to-branch'
  | 'merge-branch'
  | 'rebase-branch'
  | 'show-repository-settings'
  | 'show-kactus-settings'
  | 'open-in-shell'
  | 'compare-on-github'
  | 'view-repository-on-github'
  | 'clone-repository'
  | 'show-about'
  | 'go-to-commit-message'
  | 'boomtown'
  | 'create-sketch-file'
  | 'open-sketch'
  | 'open-pull-request'
  | 'install-cli'
  | 'open-external-editor'
  | 'select-all'
  | 'show-release-notes-popup'
  | 'show-stashed-changes'
  | 'hide-stashed-changes'
  | 'test-prune-branches'
  | 'find-text'
  | 'create-issue-in-repository-on-github'
