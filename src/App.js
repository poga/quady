import React, { Component } from 'react'
import { Stage, Layer } from 'react-konva'
import ColoredRect from './ColoredRect'
import './App.css'

const NEAR_EDGE = 50
const MIN_DRAG_DISTANCE = 200

let id = 0

class App extends Component {
  constructor (props) {
    super(props)

    this.rect = {
      id,
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      allowed: 'both',
      locked: true,
      children: []
    }
    this.state = { rect: this.rect }

    this.mode = 'none'
    this.snapped = false
    this.splitData = {}
  }

  onMouseDown (e) {
    let pos = getXY(e.evt)
    if (markNearEdge(this.rect, pos)) {
      // is dragging edge
      this.mode = 'moving'
      return
    }

    // is splitting rect
    this.mode = 'splitting'
    this.splitData = {startX: pos.x, startY: pos.y}
  }

  onMouseMove (e) {
    let pos = getXY(e.evt)
    if (this.mode !== 'moving') return

    move(this.rect, pos)
    this.setState({rect: this.rect})
  }

  onMouseUp (e) {
    if (this.mode === 'moving') {
      this.mode = 'none'
      unmark(this.rect)
      return
    }
    // do split
    let {x, y} = getXY(e.evt)
    let dx = Math.abs(x - this.splitData.startX)
    let dy = Math.abs(y - this.splitData.startY)
    if (dx > dy && dx > MIN_DRAG_DISTANCE) {
      this.rect = splitY(this.rect, {startX: this.splitData.startX, startY: this.splitData.startY, x, y})
      this.setState({rect: this.rect})
    } else if (dy > dx && dy > MIN_DRAG_DISTANCE) {
      this.rect = splitX(this.rect, {startX: this.splitData.startX, startY: this.splitData.startY, x, y})
      this.setState({rect: this.rect})
    }
    this.mode = 'none'
  }

  onMouseOut (e) {
    this.mode = 'none'
    this.splitData = {}
  }

  render () {
    return (
      <div className='App'>
        <Stage
          width={window.innerWidth}
          height={window.innerHeight}
          onMouseDown={this.onMouseDown.bind(this)}
          onTouchStart={this.onMouseDown.bind(this)}
          onMouseUp={this.onMouseUp.bind(this)}
          onTouchEnd={this.onMouseUp.bind(this)}
          onMouseMove={this.onMouseMove.bind(this)}
          onTouchMove={this.onMouseMove.bind(this)}
          >
          <Layer>
            <ColoredRect rect={this.state.rect} />
          </Layer>
        </Stage>
      </div>
    )
  }
}

export default App

function splitX (rect, pos) {
  if (rect.children.length > 0) {
    let newChildren = rect.children.map(c => splitX(c, pos))
    rect.children = newChildren

    return rect
  }

  if (!contains(rect, pos)) {
    return rect
  }
  let newChildren = []
  newChildren.push({
    id: ++id,
    x: rect.x,
    y: rect.y,
    width: pos.startX - rect.x,
    height: rect.height,
    allowed: 'y',
    children: []
  })
  newChildren.push({
    id: ++id,
    x: pos.startX,
    y: rect.y,
    width: rect.width - (pos.startX - rect.x),
    height: rect.height,
    allowed: 'y',
    children: []
  })

  rect.children = newChildren
  return rect
}

function splitY (rect, pos) {
  if (rect.children.length > 0) {
    let newChildren = rect.children.map(c => splitY(c, pos))
    rect.children = newChildren
    return rect
  }

  if (!contains(rect, pos)) {
    return rect
  }

  let newChildren = []
  newChildren.push({
    id: ++id,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: pos.startY - rect.y,
    allowed: 'y',
    children: []
  })
  newChildren.push({
    id: ++id,
    x: rect.x,
    y: pos.startY,
    width: rect.width,
    height: rect.height - (pos.startY - rect.y),
    allowed: 'y',
    children: []
  })

  rect.children = newChildren
  return rect
}

function markNearEdge (rect, pos, prefer) {
  let marked = false
  if (prefer === 'vertical') {
    if (near(pos.x, rect.x)) {
      rect.marked = marked = 'left'
    } else if (near(pos.x, rect.x + rect.width)) {
      rect.marked = marked = 'right'
    }
  } else if (prefer === 'horizontal') {
    if (near(pos.y, rect.y)) {
      rect.marked = marked = 'top'
    } else if (near(pos.y, rect.y + rect.height)) {
      rect.marked = marked = 'bottom'
    }
  } else {
    if (near(pos.x, rect.x)) {
      rect.marked = marked = 'left'
    } else if (near(pos.x, rect.x + rect.width)) {
      rect.marked = marked = 'right'
    } else if (near(pos.y, rect.y)) {
      rect.marked = marked = 'top'
    } else if (near(pos.y, rect.y + rect.height)) {
      rect.marked = marked = 'bottom'
    }
  }

  var preferred
  if (marked === 'left' || marked === 'right') {
    preferred = 'vertical'
  } else if (marked === 'top' || marked === 'bottom') {
    preferred = 'horizontal'
  }

  for (let c of rect.children) {
    var m = markNearEdge(c, pos, preferred)
    if (m) {
      marked = m
    }
  }

  return marked
}

function move (rect, pos) {
  if (rect.locked && rect.marked) {
    return rect
  }

  let newChildren = rect.children.map(r => move(r, pos))
  rect.children = newChildren

  if (!rect.marked) {
    return rect
  }

  switch (rect.marked) {
    case 'left':
      rect.width += (rect.x - pos.x)
      rect.x = pos.x
      break
    case 'right':
      rect.width = pos.x - rect.x
      break
    case 'top':
      rect.height += (rect.y - pos.y)
      rect.y = pos.y
      break
    case 'bottom':
      rect.height = pos.y - rect.y
      break
    default:
      break
  }

  return rect
}

function near (a, b) {
  return Math.abs(a - b) <= NEAR_EDGE
}

function getXY (e) {
  var x, y
  if (e.touches && e.touches[0]) {
    x = e.touches[0].pageX
    y = e.touches[0].pageY
  } else {
    x = e.pageX
    y = e.pageY
  }

  return {x, y}
}

function contains (rect, p) {
  return rect.x <= p.x && rect.x + rect.width >= p.x && rect.y <= p.y && rect.y + rect.height >= p.y
}

function unmark (rect) {
  for (let c of rect.children) {
    unmark(c)
  }

  delete rect['marked']
}
