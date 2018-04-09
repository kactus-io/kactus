function openFile(path) {
  NSWorkspace.sharedWorkspace().openURL(
    NSURL.URLWithString('kactus://importsketchfile/' + path)
  )
}

export default function(context) {
  if (!context.document.fileURL()) {
    context.document.showMessage('Open a file first ;)')
  } else {
    openFile(context.document.fileURL().path())
  }
}
