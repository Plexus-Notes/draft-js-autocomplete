# Plexus Autocomplete

A modified version of DraftJS autocomplete for Plexus V1. The modification enables you to trigger a suggestion menu for any word with no regard for a prefix like "@" or "#".

This component provide you an easy and quickly way to add autocompletion to [draft-js v0.10](https://draftjs.org/).

## Installation

```
yarn add draft-js-autocomplete
```

or

```
npm install --save draft-js-autocomplete
```

## Usage

You first need to define an autocomplete object like the example below :

```
const concept = {
  // This no longer has any meaning--should be set to the empty string just to be safe.
  prefix: '',
  // Entity type to be created when an item is selected
  type: 'CONCEPT',
  // Mutability of the entity
  mutability: 'IMMUTABLE',
  // Callback called when prefix match, returning an array of possible suggestions
  onMatch: (text) => hashtags.filter(hashtag => hashtag.indexOf(text) !== -1),
  // The entity component
  component: ({ children }) => (<span className="Hashtag">{children}</span>),
  // The items (ie suggestions) list component to use that show up in the suggestions menu
  listComponent: ({ children }) => (<ul className="HashtagList">{children}</ul>),
  // The item component to use (for individual suggestions in the menu)
  itemComponent: ({ item, onClick }) => (<li onClick={onClick}>{item}</li>),
  // Callback to format the item as it will be displayed into entity
  format: (item) => `${item}`
};
```

The second step is to include your actual Editor component with the Autocomplete component, as below :

```
import React, { Component } from 'react';
import './App.css';
import { Editor } from 'draft-js';
import Autocomplete from 'draft-js-autocomplete';

import concept from './autocompletes/hashtag';

class App extends Component {

  autocompletes = [
    concept
  ];

  constructor(props) {
    super(props);

    this.state = {
      editorState: EditorState.createEmpty()
    }
  }

  onChange = (editorState) => {
    this.setState({ editorState })
  };

  render() {
    return (
      <Autocomplete editorState={editorState} onChange={this.onChange} autocompletes={this.autocompletes}>
        <Editor />
      </Autocomplete>
    );
  }
}

export default App;
```

### Autocomplete component

Autocomplete accept all the props that draft-js Editor component accept as well as an `autocompletes` prop.

### Example
Use the commit in DraftPractice repo tagged works-first-npm-publish for an example (will need to link to this autocomplete rather than the local version, though.)
