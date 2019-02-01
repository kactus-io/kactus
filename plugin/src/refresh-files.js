// eslint-disable-next-line no-restricted-syntax
export default function() {
  const documents = NSApplication.sharedApplication().orderedDocuments()

  for (let i = 0; i < documents.length; i++) {
    const document = documents[i]

    // reload all the files that doesn't unsaved changes
    if (!document.isDocumentEdited()) {
      document.readFromURL_ofType_error(
        document.fileURL(),
        document.fileType(),
        null
      )
    }
  }
}
