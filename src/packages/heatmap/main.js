/* eslint-disable */
import { default as echarts, itemPoint } from '../../echarts-base'
import 'echarts/lib/chart/heatmap'
import 'echarts/lib/component/visualMap'
import 'echarts/extension/bmap/bmap'
import 'echarts/lib/chart/map'
import { getBmap, getMapJSON } from '../../utils'

function getAxisList (rows, label) {
  const result = []
  rows.forEach(row => {
    if (!~result.indexOf(row[label])) result.push(row[label])
  })
  return result
}

function getData (args) {
  const { rows, innerXAxisList, innerYAxisList, xDim, yDim, metrics, type } = args
  let result = null
  if (type === 'cartesian') {
    result = rows.map(row => {
      const xIndex = innerXAxisList.indexOf(row[xDim])
      const yIndex = innerYAxisList.indexOf(row[yDim])
      const value = metrics ? row[metrics] : 1
      return [xIndex, yIndex, value]
    })
  } else {
    result = rows.map(row => {
      const value = metrics ? row[metrics] : 1
      return [row[xDim], row[yDim], value]
    })
  }
  return result
}

function getAxis (list) {
  return {
    type: 'category',
    data: list,
    splitArea: { show: true }
  }
}

function getVisualMap (min, max) {
  return {
    min,
    max,
    orient: 'horizontal',
    left: 'center',
    bottom: 10
  }
}

function getSeries (args) {
  const { chartData } = args
  return [{
    type: 'heatmap',
    data: chartData
  }]
}

function getTooltip () {

}

export const heatmap = (columns, rows, settings) => {
  const {
    type = 'cartesian', // cartesian, map, bmap,
    xAxisList,
    yAxisList,
    dimension = [columns[0], columns[1]],
    metrics = columns[2],
    min,
    max,
    bmap,
    geo,
    key,
    position,
    positionJsonLink,
    beforeRegisterMap
  } = settings
  let innerXAxisList = xAxisList
  let innerYAxisList = yAxisList
  let chartData = []
  if (type === 'cartesian') {
    if (!innerXAxisList || !innerXAxisList.length) {
      innerXAxisList = getAxisList(rows, dimension[0])
    }
    if (!innerYAxisList || !innerYAxisList.length) {
      innerYAxisList = getAxisList(rows, dimension[1])
    }
    chartData = getData({
      rows,
      innerXAxisList,
      innerYAxisList,
      xDim: dimension[0],
      yDim: dimension[1],
      metrics,
      type
    })
  } else {
    chartData = getData({
      rows,
      xDim: dimension[0],
      yDim: dimension[1],
      metrics,
      type
    })
  }
  const metricsList = metrics ? rows.map(row => row[metrics]) : [1]
  const innerMin = min || Math.min.apply(null, metricsList)
  const innerMax = max || Math.max.apply(null, metricsList)

  const xAxis = getAxis(innerXAxisList)
  const yAxis = getAxis(innerYAxisList)
  const visualMap = getVisualMap(innerMin, innerMax)
  const series = getSeries({ chartData })

  const options = { visualMap, series }
  if (type === 'bmap') {
    options.series[0].coordinateSystem = 'bmap'
    options.series[0].pointSize = 10
    options.series[0].blurSize = 6
    Object.assign(options.visualMap, {
      min: 0,
      mac: 5
    })
    return getBmap(key).then(_ => {
      console.log(Object.assign({ bmap }, options))
      return Object.assign({ bmap }, options)
    })
  } else if (type === 'map') {
    options.series[0].coordinateSystem = 'geo'
    return getMapJSON(position, positionJsonLink).then(json => {
      if (beforeRegisterMap) json = beforeRegisterMap(json)
      echarts.registerMap(position, json)
      const geoAttr = Object.assign({
        map: position
      }, geo)
      return Object.assign({ geo: geoAttr }, options)
    })
  } else {
    return Object.assign({ xAxis, yAxis }, options)
  }
}
