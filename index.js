/* 
Author: Cathy Vo
Date: September 17 2024
Description: Simulating  text based fortune game code through JavaScript.
Players, ranging from 1 to 3, take turns spinning a wheel of 
points to guess hidden letters of a random word. The game round is
ended when a player guesses all the correct letters or fully solves the 
hidden word. The program supports multiple players and rounds and reveals 
letters as they are guessed through gameplay.
*/

const fs = require('fs'); //file system operations
const readlineSync = require('readline-sync'); //to get user input

function getPlayers() { //inputs num of players 
    console.log("Welcome to the CPI310 Fortune Wheel!");

    //asks for number of players
    let numPlayers = 0;
    //check to see if player number valid
    while (numPlayers < 1 || numPlayers > 3){
        numPlayers = parseInt(readlineSync.question("How many players? (1 - 3): "), 10);
        if(isNaN(numPlayers) || numPlayers < 1 || numPlayers > 3){ //if user does not enter number 1 - 3
            console.log("Invalid number of players. Enter a number between 1 - 3");
        }
    }

    const players = []; //array to store player info
    //for loop to get player names 
    for (let i = 0; i < numPlayers; i++) {
        const name = readlineSync.question(`Welcome Player ${i + 1}! Enter your name: `);

        players.push({name: name, roundScore: 0,totalScore: 0}); //adding info to the array 
    }
    return players;
}


//to load in text file
function loadDictionary() {
    try {
        const data = fs.readFileSync('dictionary.txt', 'utf-8'); //read in content as strings
        return data.split('\n').map(word => word.trim()).filter(Boolean); //split txt file by new lines and removes empty spaces

    } catch (err) {
        console.error('Error reading dictionary text file:', err); //displays err message if cant load in .txt
        process.exit(1); //return empty array for err
    }
}

//chooses random word from dictionary 
function chooseWord(dictionary) {
    const randomIndex = Math.floor(Math.random() * dictionary.length);
    return dictionary[randomIndex].toLowerCase();
}

//to spin the wheel for round scores
function spinWheel() {
    const wheelValues = [0, 650, 900, 700, 500, 800, 500, 650, 500, 900, 0, 1000, 500, 900, 700, 600, 8000, 500, 700, 600, 550, 500, 900];
    const randomIndex = Math.floor(Math.random() * wheelValues.length);
    return wheelValues[randomIndex];
}

//display current word w dashes as unrevealed letters
function displayPuzzle(puzzle, revealedLetters) {
    return puzzle.split('').map((letter, index) => revealedLetters[index] ? letter : '-').join(''); //displays word w hidden letters as dashes
}

//checks if puzzle is solved
function isPuzzleSolved(revealedLetters){
    return revealedLetters.every(letterRevealed => letterRevealed);
}

//player turn handling 
function playTurn(player, puzzle, revealedLetters) {
    console.log("\n"); //whitespace added for easier readability when game played
    console.log(`Player ${player.name}, it is your turn`);
    console.log(`Your round score is ${player.roundScore}`);
    console.log(`Puzzle: ${displayPuzzle(puzzle, revealedLetters)}`);
    console.log("\n");
    readlineSync.question("Press ENTER to spin the wheel");
    

    const wheelResult = spinWheel();
    console.log(`You spun: ${wheelResult}`);

    if (wheelResult === 0) { //if player lands on 0 
        console.log("You landed on 0. No points this turn. Your turn ends.");
        console.log("-----------------------------------------------------");
        return false; // End the current player's turn
    }

    const guess = readlineSync.question("What letter would you like to guess? ").toLowerCase();

    let matchFound = false;
    let matches = 0;

    //counts matches
    for (let i = 0; i < puzzle.length; i++) {
        if (puzzle[i] === guess && !revealedLetters[i]) {
            revealedLetters[i] = true; //reveals letters if found
            matchFound = true;
            matches++;
        }
    }

    if (matchFound) { //when player guesses correct letter
        player.roundScore += wheelResult * matches;
        console.log("\n");
        console.log(`Yes! Puzzle: ${displayPuzzle(puzzle, revealedLetters)}`);
        console.log(`Your round score is ${player.roundScore}`);
        console.log("------------------------");
        console.log("\n");

        // check if the puzzle has been fully solved
        if (isPuzzleSolved(revealedLetters)) {
            console.log("Congratulations! You solved the puzzle!");
            console.log("\n");
            player.totalScore += player.roundScore;
            return true; // exit the current round if puzzle is solved
        }

        //asks player round options ie. guess or solve
        const choice = readlineSync.question("Enter 1 to spin and guess again, or 2 to solve: ");

        if (choice === '2') { //to fully solve out the entire word
            const solution = readlineSync.question("Enter the solved word: ").toLowerCase();
            if (solution === puzzle) {
                console.log("Congratulations! You solved the puzzle!");
                console.log("\n");
                //mark all letters as revealed
                for (let i = 0; i < revealedLetters.length; i++) {
                    revealedLetters[i] = true;
                }
                player.totalScore += player.roundScore;
                return true; //exit the round after solving
            } else {
                console.log("That is incorrect. You lose all your points for this round.");
                console.log("\n");
                player.roundScore = 0; //reset round score
                return false; //end turn and move to next player
            }
        }
        return true; //continue the player's turn if they choose to spin again
    } else {
        const penalty = Math.floor(wheelResult / 2); //penalty for incorrect solve guess
        player.roundScore = Math.max(0, player.roundScore - penalty);
        console.log("No matches! Your turn ends.");
        return false; //end the current player's turn due to incorrect guess
    }
}


//plays game round 
function playRound(players, dictionary) {
    const puzzle = chooseWord(dictionary);
    const revealedLetters = Array(puzzle.length).fill(false);

    let roundOver = false;
    let currentPlayerIndex = 0; //keeps track of the current player

    while (!roundOver) {
        let player = players[currentPlayerIndex];
        let turnOver = false;

        while (!turnOver) {
            turnOver = playTurn(player, puzzle, revealedLetters);
            
            if (isPuzzleSolved(revealedLetters)) {
                roundOver = true;
                break;
            }
            
            if (!turnOver) {
                console.log("\n");
                currentPlayerIndex = (currentPlayerIndex + 1) % players.length; //move onto the next player
                break;
            }
        }
        
        if (roundOver) break;
    }

    console.log("End of the round!");
    console.log("-----------------");
    for (let player of players) {
        console.log(`${player.name} - Total Score: ${player.totalScore}`);
        console.log("-----------------");
        player.roundScore = 0; //reset score for the new round
    }
}


//main game function
function playGame() {
    const players = getPlayers();
    const dictionary = loadDictionary();
    let playAgain = true;

    while (playAgain) {
        playRound(players, dictionary);

        const replayChoice = readlineSync.question("Do you want to play another round? (Y/N)").toLowerCase();
        
        playAgain = (replayChoice === 'y');
    }
    //end game
    players.sort((a,b) => b.totalScore - a.totalScore);
    console.log(`The winner is ${players[0].name} with a total score of ${players[0].totalScore}!`);
    console.log("Goodbye! Thanks for playing");
    console.log("\n");
}

playGame();