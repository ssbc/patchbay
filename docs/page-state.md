# Page State

The parts are involved in state are:

- a **history store**
  - an array like observeable of 'location objects'
  - provided by `patch-history`
- **tabs**
  - has an array of tabs internally, each of which is associated with a page
  - has a 'selected' tab
  - each page has a unique `id`
  - provided by `hypertabs`


Ways in which the view can change:

1. Adding a page / tab:
  1. A user clicks on a markdown link (msg, feed, blob)
  2. Use a keyboard shortcut to open a message (o)
  3. A user clicks on an 'app link' (/profile etc)

2. Switching tabs:
  1. Click on a different tab
  2. Use keyboard shortcut to change tab (h/l)
  3. Click / keyboard open a link which is already open in a tab
    - a) click on the same link
    - b) click on a link which is to a message in the same page, but not the same as the original link clicked
      - e.g. click 1 to a link to firsts message in a thread, click to to a link to the 5th message in the same thread
      - don't want a new page, just want the same page, but scrolled down

3. Closing a tab
  1. Clicking the X on a tab
  2. Middle-clicking a tab?
  3. Use keyboard shortcut to close tab (x)


4. Dud link
  - take into account people clicking on links which don't resolve into a valid page.


For each of maintenance it would be nice for the 'history store' to be the _primary_ record of state, and for 'tabs' to store some.

Let's walk the above cases (with same numbers) and describe how we'd implement it.

1. Adding a page/ tab:
  1. link > normalise > push into history > listen to new history > use router to resolve into page > add new page with a serialisation of location as id
  2. same
  3. same

2. Switching tabs:
  1. block the click from getting to hypertabs > get tab location > push into history
  2. Use keyboard shortcut to change tab (h/l)
  3. Click / keyboard open a link which is already open in a tab
    - a) click on the same link
    - b) click on a link which is to a message in the same page, but not the same as the original link clicked
      - e.g. click 1 to a link to firsts message in a thread, click to to a link to the 5th message in the same thread
      - don't want a new page, just want the same page, but scrolled down

3. Closing a tab
  1. Clicking the X on a tab
  2. Middle-clicking a tab?
  3. Use keyboard shortcut to close tab (x)


4. Dud link
  - take into account people clicking on links which don't resolve into a valid page.

