import * as React from 'react';
import * as ReactDOM from 'react-dom';



require('./styles/scrollbar.css')

//import {MineSweeper} from './minesweeper'

import {MineSweeper} from '@coglite/minesweeper'


ReactDOM.render(<MineSweeper rows={16} cols={24} totalBombs={12} />, document.getElementById('mines'))