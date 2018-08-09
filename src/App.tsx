import * as React from "react";
import * as Web3 from "web3";
import * as Contract from "truffle-contract";
import Page from "emerald-js-ui/lib/components/Page";
import Button from '@material-ui/core/Button';
import Input from 'emerald-js-ui/lib/components/Input';
import { MuiThemeProvider } from '@material-ui/core/styles';
import theme from "emerald-js-ui/src/theme";

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import Paper from '@material-ui/core/Paper';

import ITodos from "./contract-interfaces/ITodos";
import getWeb3 from "./util/getWeb3";


var contractJson = require("../build/contracts/Todos.json");

interface IAppState {
  todos: string[];
  textarea: string;
  truffleContract: ITodos;
  web3: Web3;
}

const TodosContract: Contract = Contract(contractJson);

class App extends React.Component<{}, IAppState> {
  public state: IAppState;
  public input: React.Component;

  constructor(props) {
    super(props);
    this.state = {
      todos: [],
      web3: null,
      textarea: null,
      truffleContract: null,
    }
    this.refreshTodos = this.refreshTodos.bind(this);
    this.getTodoFromEventLog = this.getTodoFromEventLog.bind(this);
    this.addTodo = this.addTodo.bind(this);
  }

  public async componentWillMount() {
    const web3 = await getWeb3();
    TodosContract.setProvider(web3.currentProvider);
    this.setState({
      truffleContract: await TodosContract.deployed(),
      web3
    });
    this.refreshTodos();
  }

  async refreshTodos() {
    const todos = await this.state.truffleContract.getTodos();
    this.setState({
      todos: todos.reverse().map((todo) => this.state.web3.toAscii(todo))
    });
  }

  getTodoFromEventLog(transactionResult) {
    const newTodos = [];
    transactionResult.logs.forEach((log) => {
      if (log.event === 'AfterAddTodo') {
        newTodos.push(this.state.web3.toAscii(log.args.todo.valueOf()));
      }
    });
    this.setState({
      todos: [...newTodos, ...this.state.todos]
    });
  }

  renderTodos(todos) {
    return (
      <List component="nav">
        {this.state.todos.map((todo, i) => {
          return (
            <Paper>
              <ListItem key={i}>
                <ListItemText primary={todo} />
              </ListItem>
            </Paper>
          )
        })}
      </List>
    )
  }

  addTodo() {
    return this.state.web3.eth.getAccounts((err, accounts) => {
      return this.state.truffleContract.addTodo(this.state.web3.fromAscii(this.state.textarea), {
        from: accounts[0]
      }).then(this.getTodoFromEventLog)
        .then(() => {
          this.setState({
            textarea: ''
          });
        });
    })
  }

  handleTextAreaChange(event) {
    this.setState({
      textarea: event.target.value
    });
  }

  public render() {
    return (
      <MuiThemeProvider theme={theme}>
        <Page title="Emerald Starter Kit">
          <div>
            <Input multiline={true} id="textarea" value={this.state.textarea} onChange={this.handleTextAreaChange.bind(this)} inputRef={(input) => this.input = input}/>
            <Button variant="contained" color="primary" onClick={this.addTodo.bind(this)}>Add Todo</Button>
          </div>
          {this.state.todos && this.renderTodos(this.state.todos)}
        </Page>
      </MuiThemeProvider>
    );
  }
}

export default App;
