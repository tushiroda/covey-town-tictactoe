import {
  GameArea,
  GameMoveCommand,
  GameStatus,
  TicTacToeGameState,
  TicTacToeGridPosition,
  TicTacToeMove,
} from '../../types/CoveyTownSocket';
import PlayerController from '../PlayerController';
import GameAreaController, { GameEventTypes } from './GameAreaController';

export const PLAYER_NOT_IN_GAME_ERROR = 'Player is not in game';

export const NO_GAME_IN_PROGRESS_ERROR = 'No game in progress';

export type TicTacToeCell = 'X' | 'O' | undefined;
export type TicTacToeEvents = GameEventTypes & {
  boardChanged: (board: TicTacToeCell[][]) => void;
  turnChanged: (isOurTurn: boolean) => void;
};

/**
 * This class is responsible for managing the state of the Tic Tac Toe game, and for sending commands to the server
 */
export default class TicTacToeAreaController extends GameAreaController<
  TicTacToeGameState,
  TicTacToeEvents
> {
  /**
   * Returns the current state of the board.
   *
   * The board is a 3x3 array of TicTacToeCell, which is either 'X', 'O', or undefined.
   *
   * The 2-dimensional array is indexed by row and then column, so board[0][0] is the top-left cell,
   * and board[2][2] is the bottom-right cell
   */
  get board(): TicTacToeCell[][] {
    const board: (string | undefined)[][] = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => undefined),
    );
    this._model.game?.state.moves.forEach(move => {
      board[move.row][move.col] = move.gamePiece;
    });
    return board as TicTacToeCell[][];
  }

  /**
   * Returns the player with the 'X' game piece, if there is one, or undefined otherwise
   */
  get x(): PlayerController | undefined {
    const players: PlayerController[] = this._players.filter(
      p => p.id === this._model.game?.state.x,
    );
    return players.length > 0 ? players[0] : undefined;
  }

  /**
   * Returns the player with the 'O' game piece, if there is one, or undefined otherwise
   */
  get o(): PlayerController | undefined {
    const players: PlayerController[] = this._players.filter(
      p => p.id === this._model.game?.state.o,
    );
    return players.length > 0 ? players[0] : undefined;
  }

  /**
   * Returns the number of moves that have been made in the game
   */
  get moveCount(): number {
    return this._model.game?.state.moves.length as number;
  }

  /**
   * Returns the winner of the game, if there is one
   */
  get winner(): PlayerController | undefined {
    const players: PlayerController[] = this._players.filter(
      p => p.id === this._model.game?.state.winner,
    );
    return players.length > 0 ? players[0] : undefined;
  }

  /**
   * Returns the player whose turn it is, if the game is in progress
   * Returns undefined if the game is not in progress
   */
  get whoseTurn(): PlayerController | undefined {
    if (this._model.game?.state.status !== 'IN_PROGRESS') return undefined;

    return this._model.game.state.moves.length % 2 === 0 ? this.x : this.o;
  }

  /**
   * Returns true if it is our turn to make a move in the game
   * Returns false if it is not our turn, or if the game is not in progress
   */
  get isOurTurn(): boolean {
    if (this._townController.ourPlayer.id === this.whoseTurn?.id && this.isActive()) return true;
    else return false;
  }

  /**
   * Returns true if the current player is a player in this game
   */
  get isPlayer(): boolean {
    const players = this._players.filter(p => p.id === this._townController.ourPlayer.id);
    return players.length > 0 ? true : false;
  }

  /**
   * Returns the game piece of the current player, if the current player is a player in this game
   *
   * Throws an error PLAYER_NOT_IN_GAME_ERROR if the current player is not a player in this game
   */
  get gamePiece(): 'X' | 'O' {
    if (this._townController.ourPlayer.id === this.x?.id) return 'X';
    else if (this._townController.ourPlayer.id === this.o?.id) return 'O';
    else throw new Error(PLAYER_NOT_IN_GAME_ERROR);
  }

  /**
   * Returns the status of the game.
   * Defaults to 'WAITING_TO_START' if the game is not in progress
   */
  get status(): GameStatus {
    return this._model.game?.state.status ? this._model.game?.state.status : 'WAITING_TO_START';
  }

  /**
   * Returns true if the game is in progress
   */
  public isActive(): boolean {
    return this.status === 'IN_PROGRESS' ? true : false;
  }

  /**
   * Updates the internal state of this TicTacToeAreaController to match the new model.
   *
   * Calls super._updateFrom, which updates the occupants of this game area and
   * other common properties (including this._model).
   *
   * If the board has changed, emits a 'boardChanged' event with the new board. If the board has not changed,
   *  does not emit the event.
   *
   * If the turn has changed, emits a 'turnChanged' event with true if it is our turn, and false otherwise.
   * If the turn has not changed, does not emit the event.
   */
  protected _updateFrom(newModel: GameArea<TicTacToeGameState>): void {
    const oldBoard = JSON.stringify(this.board);
    const oldTurn = this.isOurTurn;
    super._updateFrom(newModel);
    const newBoard = JSON.stringify(this.board);
    const newTurn = this.isOurTurn;
    if (oldBoard !== newBoard) this.emit('boardChanged', this.board);
    if (oldTurn !== newTurn) this.emit('turnChanged', this.isOurTurn);
  }

  /**
   * Sends a request to the server to make a move in the game.
   * Uses the this._townController.sendInteractableCommand method to send the request.
   * The request should be of type 'GameMove',
   * and send the gameID provided by `this._instanceID`.
   *
   * If the game is not in progress, throws an error NO_GAME_IN_PROGRESS_ERROR
   *
   * @param row Row of the move
   * @param col Column of the move
   */
  public async makeMove(row: TicTacToeGridPosition, col: TicTacToeGridPosition) {
    if (!this._instanceID || this._model.game?.state.status !== 'IN_PROGRESS') {
      throw new Error(NO_GAME_IN_PROGRESS_ERROR);
    }
    const command: GameMoveCommand<TicTacToeMove> = {
      type: 'GameMove',
      gameID: this._instanceID,
      move: {
        gamePiece: this.gamePiece,
        row: row,
        col: col,
      },
    };

    await this._townController.sendInteractableCommand(this.id, command);
  }
}
