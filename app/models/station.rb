class Station < ActiveRecord::Base
  has_many :forecasts

  @@count = 0

  def check_count
    if @@count == 10
      p "Sleeping for a minute..."
      sleep(60)
      @@count = 0
    end
    @@count += 1
  end

  def set_forecasts
    self.check_count
    raw_request = Unirest.get("http://api.wunderground.com/api/#{ENV['WUAPI_KEY']}/hourly/q/pws:#{self.pws_id}.json").body
    raw_request['hourly_forecast'].each do |hour|
      forecast = Forecast.new
      forecast.parse_request(hour)
      forecast.station_id = self.id
      if forecast.save
        p "Forecast #{forecast.id} connected to Station #{self.id} saved"
      else
        byebug
      end
    end
  end

  def json
    forecasts = self.forecasts
    {
      name: self.pws_id,
      coords: [self.lat,self.lng],
      start_time: forecasts.map(&:time),
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