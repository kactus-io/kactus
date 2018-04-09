function openKactus() {
  NSWorkspace.sharedWorkspace().launchApplication('Kactus') ||
    NSWorkspace.sharedWorkspace().launchApplication('Kactus-dev') ||
    context.document.showMessage("Can't seem to find Kactus 🤔")
}

function openFile(path) {
  NSWorkspace.sharedWorkspace().openURL(
    NSURL.URLWithString('kactus://opensketchfile/' + path)
  )
}

export default function(context) {
  if (!context.document.fileURL()) {
    openKactus()
  } else {
    openFile(context.document.fileURL().path())
  }
}
