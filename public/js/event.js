const textarea = document.querySelector('textarea')
const specialKeys = ['Alt', 'Shift', 'Meta', 'Control', 'CapsLock', 'Tab', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight']
const socket = io('http://localhost:8080');

textarea.addEventListener('keydown', function (event) {
  let key = event.key == 'Enter'? '\n' : event.key
  const indexStart = textarea.selectionStart;
  const indexEnd = textarea.selectionEnd;
  if (specialKeys.includes(key)) return
  if (key == "Backspace"){
    const deleteInfo = ['delete', indexEnd, Math.min(indexStart - indexEnd, -1)]
    socket.emit('operation', deleteInfo)
  } else {
    const insertInfo = ['insert', indexStart, key]
    socket.emit('operation', insertInfo)
  }
});

socket.on('operation', (op) => {
  textarea.value = applyOperation(textarea.value, op)
})

function applyOperation(doc, operation) {
  switch (operation[0]) {
    case 'insert' :
      doc = doc.substring(0, operation[1]) + operation[2] + doc.substring(operation[1], doc.length)
      break;
    case 'delete' :
      doc = doc.substring(0, operation[1] + operation[2]) + doc.substring(operation[1], doc.length)
      break;
  }
  return doc
}