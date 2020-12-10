import {
  EditorState,
  Modifier
} from 'draft-js';

/**
 * Get all regex matches on contentBlock and call callback on each match
 * I think this function gets all matches in the current text, doesn't return the list of results
 * @TODO Edit this function to reflect new match mechanism.
 *  Will involve changing regex to a different kind of function, potentially with same callback signatures.
 * @param regex
 * @param contentBlock
 * @param callback
 * @returns {Array}
 */
export function findWithRegex(regex, contentBlock, callback) {
  const text = contentBlock.getText();
  let matchArr, matches = [];
  while ((matchArr = regex.exec(text)) !== null) {
    const start = matchArr.index;
    // We trim the match to remove last space
    const length = matchArr[0].trim().length;
    // Call callback so draft do is job
    callback(start, start + length);
    // Add the match to the result
    matches.push({
      text: matchArr[0], //not sure why the 2nd index used to be fetched
      start: start,
      end: start + length
    
    });
  }

  return matches;
}

/**
 * Get selection position
 *
 * @returns {{left: number, right: number, top: number, bottom: number}}
 */
export function getSelectionPosition() {
  const selection = document.getSelection();
  // console.log('getSelectionPosition window selection', selection)


  if (selection.rangeCount === 0) return null;

  //get the dom element corresponding to the text range being focused on

  /**
   * @TODO need to make sure parent is the right parent
   */
  const parent = selection.getRangeAt(0).startContainer.parentElement;

const tagName = parent.tagName
  if (!parent || tagName !== 'SPAN') return null;

  const boundingRect = parent.getBoundingClientRect();

  return {
    left: boundingRect.left,
    right: boundingRect.right,
    top: boundingRect.top,
    bottom: boundingRect.bottom
  }
}

/**
 * Check if current block text is empty
 *
 * @param editorState
 * @returns {boolean}
 */
export function isCurrentTextEmpty(editorState) {
  const selectionState = editorState.getSelection();
  const anchorKey = selectionState.getAnchorKey();
  const currentContent = editorState.getCurrentContent();
  const currentContentBlock = currentContent.getBlockForKey(anchorKey);
  const currentText = currentContentBlock.getText();
  return currentText.length === 0;
}

/**
 * Check if current selection is an entity
 *
 * @param editorState
 * @returns {boolean}
 */
export function isCurrentSelectionAnEntity(editorState) {
  const selectionState = editorState.getSelection();
  const anchorKey = selectionState.getAnchorKey();
  const currentContent = editorState.getCurrentContent();
  const currentContentBlock = currentContent.getBlockForKey(anchorKey);
  const startOffset = selectionState.getStartOffset();
  const endOffset = selectionState.getEndOffset();
  const entityBefore = currentContentBlock.getEntityAt(startOffset - 1);
  const entityAfter = currentContentBlock.getEntityAt(endOffset);
  return (entityBefore !== null || entityAfter !== null);
}

/**
 * Get a match depends on selection
 *
 * @param editorState
 * @param matches **consist of all mentions and mention-candidate-phrases 
 *  in the text-editor
 * @returns {*}
 */
export function getMatch(editorState, matches) {
  const selectionState = editorState.getSelection();
  const anchorKey = selectionState.getAnchorKey();

  // If no matches for this block, no need to continue
  if (!matches[anchorKey]) return null;
  const currentBlockMatches = matches[anchorKey];

  //the index where the cursor currently is blinking
  const startOffset = selectionState.getStartOffset();
  // console.log('Current block matches:', currentBlockMatches)

  // For all matches in this block, we reduce all types
  // to get the first match, return null if no match found
  return Object.keys(currentBlockMatches).reduce((previous, type) => {
    // Only if no match found yet
    if (previous === null) {
      // Reduce all matches to get the first one that is in selection range
      // return null if no match found
      return currentBlockMatches[type].reduce((previous, match) => {
        const inOffset = (startOffset >= match.start && startOffset <= match.end);
        return !inOffset ? previous : {
          ...match,
          type
        };
      }, null);
    }

    return previous;
  }, null);
}

/**
 * Get autocomplete config depending on match
 *
 * @param autocompletes
 * @param match
 * @returns {*}
 */
export function getAutocomplete(autocompletes, match) {
  return autocompletes.reduce((previous, autocomplete) => {
    return (previous === null && autocomplete.type === match.type) ? autocomplete : previous;
  }, null);
}

/**
 * Get suggestions from onMatch autocomplete config method
 * @TODO expose all text in editor to this function
 * @param autocomplete
 * @param match
 * @returns {Promise<*>}
 */
export async function getSuggestions(autocomplete, match, allTextInEditor) {
  if (typeof autocomplete.onMatch !== 'function') return [];
  
  // Call onMatch method for found autocomplete
  try {
    var x = await autocomplete.onMatch(allTextInEditor, match)
    return x
  } catch(e) {
    return [];
  }
}

/**
 * Add entity to editorState and return the new editorState
 * @TODO take range from the suggestion itself, rather than the other thing
 * @param editorState
 * @param item Suggestion Item Data
 * @param match
 * @returns {*}
 */
export function addEntityToEditorState(editorState, item, match) {
  // Range text to replace, the type and prefix
  const {type, mutability, format } = match;

  item.text = (item.implicitText != undefined) ? item.implicitText : item.suggestedText

  const start = (item.implicitStartIndex != undefined) ? 
    item.implicitStartIndex 
    : item.suggestionStartIndex != undefined ? 
      item.suggestionStartIndex 
      : match.start
  const end = (item.implicitEndIndex != undefined) ? item.implicitEndIndex: match.end
  // console.log('start-end', `${start}-${end}`)

  // Create selection from range
  const currentSelectionState = editorState.getSelection();
  const selection = currentSelectionState.merge({
    anchorOffset: start,
    focusOffset: end,
  });
  // Create entity
  const contentState = editorState.getCurrentContent();
  const contentStateWithEntity = contentState.createEntity(
    type,
    mutability,
    item
  );
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

  // Replace selection with the new create entity
  let newContentState = Modifier.replaceText(
    contentStateWithEntity,
    selection,
    format(item),
    null,
    entityKey,
  );

  // Push new contentState with type
  const newEditorState = EditorState.push(
    editorState,
    newContentState,
    'insert-autocomplete'
  );

  // Update cursor position after inserted content
  return EditorState.forceSelection(
    newEditorState,
    newContentState.getSelectionAfter()
  );
}
