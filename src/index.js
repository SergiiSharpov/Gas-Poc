import App from './js/App';

let loaderNode = document.body.querySelector('.loader-container');
let statusNode = loaderNode.querySelector('.loader-status');

statusNode.innerText = 'Core loading...';

App.load()
.then(({default : Main}) => {
  statusNode.innerText = 'Resources loading...';
  
  return Main.preload('./static', (loaded) => {statusNode.innerText = 'Resources loading ' + Math.round(loaded * 100) + '%'})
})
.then((MainApp) => {
  document.body.appendChild(MainApp.canvas);
  MainApp.updateSize();
  
  console.log(MainApp);
  
  loaderNode.style.display = 'none';
});
