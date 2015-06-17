class Forecast < ActiveRecord::Base
  belongs_to :station

  def parse_request(hour)
    self.time = hour['FCTTIME']['epoch']
    self.temp = hour['temp']['english']
    self.dewpoint = hour['dewpoint']['english']
    self.wspd = hour['wspd']['english']
    self.wdir = hour['wdir']['english']
    self.humidity = hour['humidity']
    self.feelslike = hour['feelslike']['english']
    self.pressure = hour['mslp']['metric']
  end

end

