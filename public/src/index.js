import FileSystemModel from './models/file_system_model.js'
import OperationModel from './models/operation_model.js'
import SocketIO from './utils/socket_io.js'
import Api from './utils/api.js'
import OperationController from './controllers/operation_controller.js'
import FileSystemController from './controllers/file_system_controller.js'

const operationModel = new OperationModel()
const fileSystemModel = new FileSystemModel()
const socketIO = new SocketIO()
const api = new Api()
const operationController = new OperationController(  operationModel,
                                                      fileSystemModel,
                                                      socketIO,
                                                      api
                                                    )
const fileSystemController = new FileSystemController(  operationModel,
                                                        fileSystemModel,
                                                        socketIO,
                                                        api
                                                    )

// app.init()
operationController.init()
fileSystemController.init()


