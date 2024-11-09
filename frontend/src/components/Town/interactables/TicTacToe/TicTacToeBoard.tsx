import { Button, chakra, Container, useToast } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import TicTacToeAreaController, {
  TicTacToeCell,
} from '../../../../classes/interactable/TicTacToeAreaController';
import { TicTacToeGridPosition } from '../../../../types/CoveyTownSocket';

export type TicTacToeGameProps = {
  gameAreaController: TicTacToeAreaController;
};

/**
 * A component that will render a single cell in the TicTacToe board, styled
 */
const StyledTicTacToeSquare = chakra(Button, {
  baseStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    flexBasis: '33%',
    border: '1px solid black',
    height: '33%',
    fontSize: '50px',
    _disabled: {
      opacity: '100%',
    },
  },
});
/**
 * A component that will render the TicTacToe board, styled
 */
const StyledTicTacToeBoard = chakra(Container, {
  baseStyle: {
    display: 'flex',
    width: '400px',
    height: '400px',
    padding: '5px',
    flexWrap: 'wrap',
  },
});

/**
 * A component that renders the TicTacToe board
 *
 * Renders the TicTacToe board as a "StyledTicTacToeBoard", which consists of 9 "StyledTicTacToeSquare"s
 * (one for each cell in the board, starting from the top left and going left to right, top to bottom).
 * Each StyledTicTacToeSquare has an aria-label property that describes the cell's position in the board,
 * formatted as `Cell ${rowIndex},${colIndex}`.
 *
 * The board is re-rendered whenever the board changes, and each cell is re-rendered whenever the value
 * of that cell changes.
 *
 * If the current player is in the game, then each StyledTicTacToeSquare is clickable, and clicking
 * on it will make a move in that cell. If there is an error making the move, then a toast will be
 * displayed with the error message as the description of the toast. If it is not the current player's
 * turn, then the StyledTicTacToeSquare will be disabled.
 *
 * @param gameAreaController the controller for the TicTacToe game
 */
export default function TicTacToeBoard({ gameAreaController }: TicTacToeGameProps): JSX.Element {
  const toast = useToast();
  const [dis, setDisabled] = useState(!gameAreaController.isOurTurn);
  const [, setBoard] = useState(gameAreaController.board);
  const [, setOurTurn] = useState(gameAreaController.isOurTurn);

  /**
   * When a boardChanged event is emitted, this function is called to set the board to
   * the new board passed in
   */
  const boardChanged = (b: TicTacToeCell[][]) => {
    setDisabled(!gameAreaController.isOurTurn);
    setBoard(b);
  };

  /**
   * When a turnChanged event is emitted, this function is called to set state variables for
   * whose turn it is and whether or not the gridcells should be disabled
   */
  const turnChanged = () => {
    setOurTurn(gameAreaController.isOurTurn);
    setDisabled(!gameAreaController.isOurTurn);
  };

  /**
   * Onclick function for each gridcell. Takes in a row and col parameter, then attempts to make
   * the move. On error, calls a toast with the error message.
   *
   * @param row
   * @param col
   */
  async function click(row: TicTacToeGridPosition, col: TicTacToeGridPosition): Promise<void> {
    try {
      await gameAreaController.makeMove(row, col);
    } catch (error) {
      if (error) toast({ description: error.toString(), status: 'error' });
    }
  }

  useEffect(() => {
    gameAreaController.addListener('boardChanged', boardChanged);
    gameAreaController.addListener('turnChanged', turnChanged);
    return () => {
      gameAreaController.removeListener('boardChanged', boardChanged);
      gameAreaController.removeListener('turnChanged', turnChanged);
    };
  });

  return (
    <StyledTicTacToeBoard aria-label='Tic-Tac-Toe Board'>
      <StyledTicTacToeSquare disabled={dis} onClick={() => click(0, 0)} aria-label='Cell 0,0'>
        {gameAreaController.board[0][0]}
      </StyledTicTacToeSquare>
      <StyledTicTacToeSquare disabled={dis} onClick={() => click(0, 1)} aria-label='Cell 0,1'>
        {gameAreaController.board[0][1]}
      </StyledTicTacToeSquare>
      <StyledTicTacToeSquare disabled={dis} onClick={() => click(0, 2)} aria-label='Cell 0,2'>
        {gameAreaController.board[0][2]}
      </StyledTicTacToeSquare>
      <StyledTicTacToeSquare disabled={dis} onClick={() => click(1, 0)} aria-label='Cell 1,0'>
        {gameAreaController.board[1][0]}
      </StyledTicTacToeSquare>
      <StyledTicTacToeSquare disabled={dis} onClick={() => click(1, 1)} aria-label='Cell 1,1'>
        {gameAreaController.board[1][1]}
      </StyledTicTacToeSquare>
      <StyledTicTacToeSquare disabled={dis} onClick={() => click(1, 2)} aria-label='Cell 1,2'>
        {gameAreaController.board[1][2]}
      </StyledTicTacToeSquare>
      <StyledTicTacToeSquare disabled={dis} onClick={() => click(2, 0)} aria-label='Cell 2,0'>
        {gameAreaController.board[2][0]}
      </StyledTicTacToeSquare>
      <StyledTicTacToeSquare disabled={dis} onClick={() => click(2, 1)} aria-label='Cell 2,1'>
        {gameAreaController.board[2][1]}
      </StyledTicTacToeSquare>
      <StyledTicTacToeSquare disabled={dis} onClick={() => click(2, 2)} aria-label='Cell 2,2'>
        {gameAreaController.board[2][2]}
      </StyledTicTacToeSquare>
    </StyledTicTacToeBoard>
  );
}
