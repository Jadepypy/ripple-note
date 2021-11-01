import AppController from './controllers/app_controller.js'
// import NoteController from './controllers/file_system_controller'
import FileSystemModel from './models/file_system_model.js'
import PanelModel from './models/panel_model.js'
import OperationModel from './models/operation_model.js'
import SidebarView from './views/sidebar_view.js'
import PanelView from './views/panel_view.js'
import EditorView from './views/editor_view.js'
import SocketIO from './utils/socket_io.js'
import Api from './utils/api.js'

const app = new AppController(
  new OperationModel(),
  new FileSystemModel(),
  new PanelModel(),
  new SidebarView(),
  new PanelView(),
  new EditorView(),
  new SocketIO(),
  new Api()
)

app.init()


