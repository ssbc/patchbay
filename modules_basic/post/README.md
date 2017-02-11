# Post

Definition: A message which contains a `text` field which is human/ markdown readable

```js
{ 
  type: 'post',
  text: '...'
}
```

## Reply / Comment

Definition: A Post which also points at another message


```js
{ 
  type: 'post',
  text: '...'
  root: '',
  branch: ''
}
```

