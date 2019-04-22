const STEP_INTERVAL_MS = 500; // ms

const initialState = {
  // TODO: Make a real board.
  board: [
    [
      { pieceName: "pawn", pieceColor: "black" },
      {},
      {},
      {},
      {},
      { pieceName: "pawn", pieceColor: "black" },
      {},
      {}
    ],
    [
      {},
      {},
      {},
      { pieceName: "pawn", pieceColor: "black" },
      {},
      { pieceName: "pawn", pieceColor: "black" },
      {},
      {}
    ],
    [{}, {}, {}, {}, { pieceName: "queen", pieceColor: "white" }, {}, {}, {}],
    [
      {},
      { pieceName: "pawn", pieceColor: "black" },
      {},
      {},
      {},
      { pieceName: "pawn", pieceColor: "black" },
      {},
      {}
    ],
    [
      {},
      {},
      {},
      { pieceName: "pawn", pieceColor: "black" },
      {},
      {},
      {},
      { pieceName: "pawn", pieceColor: "black" }
    ],
    [
      {},
      { pieceName: "pawn", pieceColor: "black" },
      {},
      {},
      {},
      { pieceName: "pawn", pieceColor: "black" },
      {},
      {}
    ],
    [{}, {}, {}, {}, {}, {}, {}, { pieceName: "pawn", pieceColor: "black" }],
    [
      { pieceName: "pawn", pieceColor: "black" },
      {},
      {},
      { pieceName: "pawn", pieceColor: "black" },
      { pieceName: "pawn", pieceColor: "black" },
      {},
      {},
      {}
    ]
  ],
  capturedPieces: {
    black: [],
    white: []
  },
  selectedPosition: null,
  turnColor: "white"
};

// TODO: Add more pieces.
const pieces = {
  pawn: {
    shape: "♟",
    getPossiblePositions(startPosition, color) {
      const pieceHasMoved =
        color === "black" ? startPosition[0] !== 1 : startPosition[0] !== 6;

      const positions = [];

      const yDirection = color === "black" ? 1 : -1;
      const nextRowIndex = startPosition[0] + yDirection;
      const positionInFront = [nextRowIndex, startPosition[1]];
      const squareInFront = getSquare(positionInFront);

      if (!squareInFront.color) {
        positions.push(positionInFront);

        if (!pieceHasMoved) {
          const extraMovePosition = [
            positionInFront[0] + yDirection,
            positionInFront[1]
          ];

          const extraMoveSquare = getSquare(extraMovePosition);

          if (!extraMoveSquare.pieceColor) {
            positions.push(extraMovePosition);
          }
        }
      }

      const attackPositions = [
        [nextRowIndex, startPosition[1] - 1],
        [nextRowIndex, startPosition[1] + 1]
      ];

      attackPositions
        .filter(getIsOnBoard)
        .filter(position => {
          const square = getSquare(position);
          return square.pieceColor && square.pieceColor !== color;
        })
        .forEach(position => positions.push(position));

      return positions;
    }
  },
  queen: {
    shape: "♛",
    getPossiblePositions(startPosition, color) {
      const positions = [];

      const directions = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1]
      ];

      for (let direction of directions) {
        let position = getCopy(startPosition);

        while (true) {
          position = [position[0] + direction[0], position[1] + direction[1]];
          const positionIsOnBoard = getIsOnBoard(position);

          if (!positionIsOnBoard) break;

          const { pieceColor } = getSquare(position);

          if (pieceColor === color) break;

          positions.push(position);

          if (pieceColor && pieceColor !== color) break;
        }
      }

      return positions;
    }
  }
};

let state = initialState;

const setState = stateUpdate => {
  state = { ...state, ...stateUpdate };
  rootRender();
};

const rootNode = document.getElementById("root");

const rootRender = () => {
  rootNode.innerHTML = `
    <div class="board-container">
      <div class="board">
        ${state.board.map(renderRow).join("")}
      </div>
    </div>
  `;

  // TODO: Delete this mess.
  const numPieces = state.board
    .reduce((rows, row) => rows.concat(row), [])
    .reduce(
      (numPieces, square) => (square.pieceColor ? numPieces + 1 : numPieces),
      0
    );
  if (numPieces === 1)
    rootNode.innerHTML = `<div class="yay">🎉</div>`;
};

const renderRow = (row, rowIndex) =>
  `<div class="row">
    ${row
      .map((square, squareIndex) =>
        renderSquare(square, [rowIndex, squareIndex])
      )
      .join("")}
  </div>`;

const renderSquare = (square, position) => {
  return `<div class="square ${
    getPositionsAreSame(position, state.selectedPosition)
      ? "square--selected"
      : ""
  } ${(position[0] + position[1]) % 2 === 1 ? "square--dark" : ""} ${
    getPositionIsInPossibleMoves(position) ? "square--possibleMove" : ""
  }" onclick="handleSquareClick(${JSON.stringify(position)})">
    ${
      square.pieceName && square.pieceColor
        ? renderPiece(square.pieceName, square.pieceColor)
        : ""
    }
  </div>`;
};

const renderPiece = (name, color) =>
  `<div class="piece piece--${color}">${pieces[name].shape}</div>`;

const getCopy = object => JSON.parse(JSON.stringify(object));

const getIsOnBoard = position =>
  position[0] >= 0 &&
  position[0] < state.board.length &&
  position[1] >= 0 &&
  position[1] < state.board[0].length;

const getPositionsAreSame = (position1, position2) =>
  JSON.stringify(position1) === JSON.stringify(position2);

const getPositionIsInPossibleMoves = position => {
  if (!state.selectedPosition) return false;

  const { pieceName } = getSquare(state.selectedPosition);
  const piece = pieces[pieceName];

  const possiblePositions = piece.getPossiblePositions(
    state.selectedPosition,
    state.turnColor
  );

  const result = possiblePositions.some(possiblePosition =>
    getPositionsAreSame(position, possiblePosition)
  );

  return result;
};

const getSquare = position => {
  const [rowIndex, squareIndex] = position;
  return getCopy(state.board[rowIndex][squareIndex]);
};

const move = (sourcePosition, destination) => {
  const [sourceRow, sourceColumn] = sourcePosition;
  const [destinationRow, destinationColumn] = destination;

  const board = getCopy(state.board);
  const sourceSquare = getSquare(sourcePosition);

  board[destinationRow][destinationColumn] = sourceSquare;
  board[sourceRow][sourceColumn] = {};

  setState({ board, selectedPosition: null });
};

const handleSquareClick = position => {
  if (state.selectedPosition !== null) {
    const positionIsSameAsSelected = getPositionsAreSame(
      position,
      state.selectedPosition
    );

    if (positionIsSameAsSelected) {
      setState({ selectedPosition: null });
      return;
    }

    const originalSquare = getSquare(state.selectedPosition);
    const { pieceName, pieceColor } = originalSquare;
    const piece = pieces[pieceName];

    const possiblePositions = piece.getPossiblePositions(
      state.selectedPosition,
      pieceColor
    );

    const moveIsPossible = possiblePositions.some(possiblePosition =>
      getPositionsAreSame(position, possiblePosition)
    );

    if (moveIsPossible) {
      move(state.selectedPosition, position);
    }
  } else {
    const { pieceColor } = getSquare(position);

    if (pieceColor === state.turnColor)
      setState({ selectedPosition: position });
  }
};

rootRender();
