/* eslint-disable no-undef */
// eslint-disable-next-line no-unused-vars
function refreshData () {
  $.getJSON('/api/reading', (data) => {
    if (data && !data.err) {
      $('.calcUsage').text(data.calculatedUsage)
      $('.currentUsage').text(data.currentUsage || 0)
      $('.currentDelivery').text(data.currentDelivery || 0)
      $('.totalT1Usage').text(Math.round(data.totalT1Use || 0))
      $('.totalT2Usage').text(Math.round(data.totalT2Use || 0))
      $('.totalT1Delivered').text(Math.round(data.totalT1Delivered || 0))
      $('.totalT2Delivered').text(Math.round(data.totalT2Delivered || 0))

      $('.powerLabel').attr('title', data.powerSn)
      $('.powerTs').text(data.powerTs)

      $('.gasLabel').attr('title', data.gasSn)
      $('.gasTs').text(data.gas.ts)
      let gas = data.gas.totalUse
      gas = Math.round(gas * 100.0) / 100.0
      $('.totalGas').text(gas)
    }
    setTimeout(refreshData, 10000)
  })
}
