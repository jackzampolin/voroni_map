class Station < ActiveRecord::Base
  has_many :forecasts

  def set_forecasts
    raw_request = Unirest.get("http://api.wunderground.com/api/#{ENV['WUAPI_KEY']}/hourly/q/pws:#{self.pws_id}.json").body
    raw_request['hourly_forecast'].each do |hour|
      forecast = Forecast.new
      forecast.parse_request(hour)
      forecast.station_id = self.id
      forecast.save
    end
  end

  def json
    forecasts = self.forecasts
    {
      name: self.pws_id,
      coords: [self.lat,self.lng],
      temp: forecasts.map(&:temp),
      dewpoint: forecasts.map(&:dewpoint),
      wspd: forecasts.map(&:wspd),
      wdir: forecasts.map(&:wdir),
      humidity: forecasts.map(&:humidity),
      feelslike: forecasts.map(&:feelslike),
      pressure: forecasts.map(&:pressure)
    }
  end

end

# lat: obj['lat'] => float
# lng: obj['lng'] => float
# pws_id: obj['pws'] => string
# forecast_id: forigen_key => integer