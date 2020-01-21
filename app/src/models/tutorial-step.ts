export enum TutorialStep {
  NotApplicable = 'NotApplicable',
  InstallSketch = 'InstallSketch',
  CreateBranch = 'CreateBranch',
  CreateNewFile = 'CreateNewFile',
  MakeCommit = 'MakeCommit',
  PushBranch = 'PushBranch',
  OpenPullRequest = 'OpenPullRequest',
  AllDone = 'AllDone',
  Paused = 'Paused',
}

export type ValidTutorialStep =
  | TutorialStep.InstallSketch
  | TutorialStep.CreateBranch
  | TutorialStep.CreateNewFile
  | TutorialStep.MakeCommit
  | TutorialStep.PushBranch
  | TutorialStep.OpenPullRequest
  | TutorialStep.AllDone

export function isValidTutorialStep(
  step: TutorialStep
): step is ValidTutorialStep {
  return step !== TutorialStep.NotApplicable && step !== TutorialStep.Paused
}

export const orderedTutorialSteps: ReadonlyArray<ValidTutorialStep> = [
  TutorialStep.InstallSketch,
  TutorialStep.CreateBranch,
  TutorialStep.CreateNewFile,
  TutorialStep.MakeCommit,
  TutorialStep.PushBranch,
  TutorialStep.OpenPullRequest,
  TutorialStep.AllDone,
]
