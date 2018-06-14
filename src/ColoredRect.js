import React from 'react'
import {Rect, Group} from 'react-konva'

class ColoredRect extends React.Component {
  constructor (props) {
    super(props)
    this.state = {mode: 'none'}
  }

  render () {
    return (
      <Group>
        <Rect
          key={this.props.rect.id}
          x={this.props.rect.x}
          y={this.props.rect.y}
          width={this.props.rect.width}
          height={this.props.rect.height}
          fill={this.props.rect.color}
          stroke='black'
          strokeWidth={10}
          />

        {this.props.rect.children.map(c => <ColoredRect key={c.id} rect={c} />)}
      </Group>
    )
  }
}

export default ColoredRect
