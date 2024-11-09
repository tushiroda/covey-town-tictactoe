import {
  Button,
  List,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useToast,
} from '@chakra-ui/react';
import React, { useCallback } from 'react';
import TicTacToeAreaController from '../../../../classes/interactable/TicTacToeAreaController';
import { useInteractable, useInteractableAreaController } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import { InteractableID } from '../../../../types/CoveyTownSocket';
import GameAreaInteractable from '../GameArea';
import Leaderboard from '../Leaderboard';
import { useEffect } from 'react';
import { useState } from 'react';

/**
 * The TicTacToeArea component renders the TicTacToe game area.
 * It renders the current state of the area, optionally allowing the player to join the game.
 *
 * It uses Chakra-UI components (does not use other GUI widgets)
 *
 * It uses the TicTacToeAreaController to get the current state of the game.
 * It listens for the 'gameUpdated' and 'gameEnd' events on the controller, and re-renders accordingly.
 * It subscribes to these events when the component mounts, and unsubscribes when the component unmounts. It also unsubscribes when the gameAreaController changes.
 *
 * It renders the following:
 * - A leaderboard (@see Leaderboard.tsx), which is passed the game history as a prop
 * - A list of observers' usernames (in a list with the aria-label 'list of observers in the game', one username per-listitem)
 * - A list of players' usernames (in a list with the aria-label 'list of players in the game', one item for X and one for O)
 *    - If there is no player in the game, the username is '(No player yet!)'
 *    - List the players as (exactly) `X: ${username}` and `O: ${username}`
 * - A message indicating the current game status:
 *    - If the game is in progress, the message is 'Game in progress, {moveCount} moves in, currently {whoseTurn}'s turn'. If it is currently our player's turn, the message is 'Game in progress, {moveCount} moves in, currently your turn'
 *    - Otherwise the message is 'Game {not yet started | over}.'
 * - If the game is in status WAITING_TO_START or OVER, a button to join the game is displayed, with the text 'Join New Game'
 *    - Clicking the button calls the joinGame method on the gameAreaController
 *    - Before calling joinGame method, the button is disabled and has the property isLoading set to true, and is re-enabled when the method call completes
 *    - If the method call fails, a toast is displayed with the error message as the description of the toast (and status 'error')
 *    - Once the player joins the game, the button dissapears
 * - The TicTacToeBoard component, which is passed the current gameAreaController as a prop (@see TicTacToeBoard.tsx)
 *
 * - When the game ends, a toast is displayed with the result of the game:
 *    - Tie: description 'Game ended in a tie'
 *    - Our player won: description 'You won!'
 *    - Our player lost: description 'You lost :('
 *
 */
function TicTacToeArea({ interactableID }: { interactableID: InteractableID }): JSX.Element {
  const gameAreaController = useInteractableAreaController<TicTacToeAreaController>(interactableID);
  const toast = useToast();
  const [, setHistory] = useState(gameAreaController.history);
  const [, setStatus] = useState(gameAreaController.status);
  const [, setIsPlayer] = useState(gameAreaController.isPlayer);
  const [, setObservers] = useState(gameAreaController.observers);
  const [joining, setJoining] = useState(false);
  const [buttonText, setButtonText] = useState('Join New Game');
  const [, setNumMoves] = useState(gameAreaController.moveCount);

  /** I have to use callback functions for almost everything because useEffect expects an array
   * filled with all functions and variables that are used within it. Without the callback wrap,
   * it'll call my update functions, go to useEffect to update since some variables changed, and
   * call the update functions again. This makes an infinite loop. I could have alternatively just
   * added a lintignore like most of the internet said, but i figured that wouldn't have been allowed
   */

  /**
   * Gets the string that shows whose turn it currently is
   *
   * @returns a string
   */
  const currentTurnPlayerString = useCallback(() => {
    if (gameAreaController.isOurTurn) return 'your';
    else return gameAreaController.whoseTurn?.userName + "'s";
  }, [gameAreaController.isOurTurn, gameAreaController.whoseTurn?.userName]);

  /**
   * Helper function for setting gameStatusText, which is the string for the current
   * status of the game
   *
   * @returns a string that represents the status of the game
   */
  const sgstHelper = useCallback(() => {
    let output = '';
    if (gameAreaController.status === 'WAITING_TO_START') output = 'Game not yet started';
    else if (gameAreaController.status === 'IN_PROGRESS') output = 'Game in progress';
    else if (gameAreaController.status === 'OVER') output = 'Game over';

    output += `, ${
      gameAreaController.moveCount
    } moves in, currently ${currentTurnPlayerString()} turn`;
    return output;
  }, [currentTurnPlayerString, gameAreaController.moveCount, gameAreaController.status]);
  const [gameStatusText, setGameStatusText] = useState(sgstHelper);

  const observerList = gameAreaController.observers.map(player => {
    return <li key={player.id}>{player.userName}</li>;
  });
  const [playerX, setX] = useState(
    gameAreaController.x !== undefined ? gameAreaController.x.userName : '(No player yet!)',
  );
  const [playerO, setO] = useState(
    gameAreaController.o !== undefined ? gameAreaController.o.userName : '(No player yet!)',
  );

  /**
   * Updates all the state variables in this component when called
   */
  const updateGame = useCallback(() => {
    setHistory(gameAreaController.history);
    setStatus(gameAreaController.status);
    setIsPlayer(gameAreaController.isPlayer);
    setObservers(gameAreaController.observers);
    setX(gameAreaController.x !== undefined ? gameAreaController.x.userName : '(No player yet!)');
    setO(gameAreaController.o !== undefined ? gameAreaController.o.userName : '(No player yet!)');
    setGameStatusText(sgstHelper);
    setNumMoves(gameAreaController.moveCount);
  }, [
    gameAreaController.history,
    gameAreaController.status,
    gameAreaController.isPlayer,
    gameAreaController.observers,
    gameAreaController.moveCount,
    gameAreaController.x,
    gameAreaController.o,
    sgstHelper,
  ]);

  /**
   * When the game ends, this function is called to call a toast with the results
   */
  const endGame = useCallback(() => {
    let text = '';
    const us = gameAreaController.gamePiece === 'X' ? gameAreaController.x : gameAreaController.o;

    if (gameAreaController.winner === undefined) text = 'Game ended in a tie';
    else if (gameAreaController.winner === us) text = 'You won!';
    else text = 'You lost :(';

    toast({
      description: text,
    });
  }, [
    gameAreaController.gamePiece,
    gameAreaController.x,
    gameAreaController.o,
    gameAreaController.winner,
    toast,
  ]);

  /**
   * Function that is called when a player clicks on join game. Sets the button text and attempts
   * to connect them to the game. On success, they join. On fail, a toast pops up.
   */
  async function buttonClick(): Promise<void> {
    setButtonText('Loading...');
    setJoining(true);
    try {
      await gameAreaController.joinGame();
    } catch (error) {
      if (error) {
        toast({
          description: error.toString(),
          status: 'error',
        });
      }
    }
    setButtonText('Join New Game');
    setJoining(false);
  }

  useEffect(() => {
    gameAreaController.addListener('gameUpdated', updateGame);
    gameAreaController.addListener('gameEnd', endGame);
    return () => {
      gameAreaController.removeListener('gameUpdated', updateGame);
      gameAreaController.removeListener('gameEnd', endGame);
    };
  }, [gameAreaController, updateGame, endGame]);

  return (
    <>
      {gameStatusText}
      {!gameAreaController.isPlayer && gameAreaController.status !== 'IN_PROGRESS' && (
        <Button onClick={buttonClick} disabled={joining}>
          {buttonText}
        </Button>
      )}
      <List aria-label='list of players in the game'>
        <li>X: {playerX}</li>
        <li>O: {playerO}</li>
      </List>
      <List aria-label='list of observers in the game'>{observerList}</List>
      <Leaderboard results={gameAreaController.history} />
    </>
  );
}

// Do not edit below this line
/**
 * A wrapper component for the TicTacToeArea component.
 * Determines if the player is currently in a tic tac toe area on the map, and if so,
 * renders the TicTacToeArea component in a modal.
 *
 */
export default function TicTacToeAreaWrapper(): JSX.Element {
  const gameArea = useInteractable<GameAreaInteractable>('gameArea');
  const townController = useTownController();
  const closeModal = useCallback(() => {
    if (gameArea) {
      townController.interactEnd(gameArea);
      const controller = townController.getGameAreaController(gameArea);
      controller.leaveGame();
    }
  }, [townController, gameArea]);

  if (gameArea && gameArea.getData('type') === 'TicTacToe') {
    return (
      <Modal isOpen={true} onClose={closeModal} closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{gameArea.name}</ModalHeader>
          <ModalCloseButton />
          <TicTacToeArea interactableID={gameArea.name} />;
        </ModalContent>
      </Modal>
    );
  }
  return <></>;
}
