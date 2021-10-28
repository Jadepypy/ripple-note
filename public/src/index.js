import AppController from './controllers/app_controller.js'
// import NoteController from './controllers/file_system_controller'
import FileSystemModel from './models/file_system_model.js'
import NoteModel from './models/note_model.js'
import SidebarView from './views/sidebar_view.js'
import PanelView from './views/panel_view.js'
import EditorView from './views/editor_view.js'

const app = new AppController(
  new NoteModel(),
  new FileSystemModel(),
  new SidebarView(),
  new PanelView(),
  new EditorView()
)

app.init()
