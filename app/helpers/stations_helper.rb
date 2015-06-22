module StationsHelper

  # JUST CREATES ['#FF0000',...,'#0000FF'] Blue to Red gradient with specified length.
  class Hex
    class << self
      def to_hex(array)
        array.map do |num|
          num.to_s(16)
        end
      end

      def steps(num_steps)
        step_size = (255/num_steps).round
        range = 255 + step_size
        step_size = (range/num_steps).round
        output = Array.new(num_steps)
        output = output.each_index.map do |index|
          (index*step_size).abs
        end
        output[-1] = 255
        to_hex(output)
      end


      def check_value(value)
        if value == '0'
          '00'
        else
          value
        end
      end

      def create_colors(ar1,ar3)
        ar1.each_index.map do |index|
          red = check_value(ar1[index])
          blue = check_value(ar3[index])
          red.length == 1 ? red = '0'+red : nil
          blue.length == 1 ? blue = '0'+blue : nil
          "#" + "#{red}#{'00'}#{blue}"
        end
      end

      def to_upcase(array)
        array.map do |string|
          string.chars.map(&:upcase).join('')
        end
      end

      def colors(num_steps)
        red = steps(num_steps)
        blue = steps(num_steps).reverse
        to_upcase(create_colors(red,blue))
      end
    end
  end

  def color_hash(atr)
    # creates a number of key value pairs with the form { value => hex_color }
    temps = atr.flatten.uniq.sort
    Hash[temps.zip(Hex.colors(temps.length))]
  end

  def key_hashes(payload)
    {
      temp: color_hash(payload.map{ |hash| hash[:temp] }),
      dewpoint: color_hash(payload.map{ |hash| hash[:dewpoint] }),
      wspd: color_hash(payload.map{ |hash| hash[:wspd] }),
      wdir: color_hash(payload.map{ |hash| hash[:wdir] }),
      humidity: color_hash(payload.map{ |hash| hash[:humidity] }),
      feelslike: color_hash(payload.map{ |hash| hash[:feelslike] }),
      pressure: color_hash(payload.map{ |hash| hash[:pressure] })
    }
  end

end
